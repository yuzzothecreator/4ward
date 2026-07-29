import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { calculateFees } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Seller dashboard metrics from Postgres.
 * GET /api/dashboard/stats?email=
 */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json({
      demo: true,
      warning: db.error,
      stats: {
        sales: 0,
        revenue: 0,
        netRevenue: 0,
        views: 0,
        downloads: 0,
        listings: 0,
        salesChangePct: null,
        revenueChangePct: null,
      },
      projects: [],
      orders: [],
      monthlyRevenue: [],
      popularProjects: [],
    });
  }

  try {
    const prisma = await getPrisma();
    const seller = await prisma.user.findUnique({ where: { email } });
    if (!seller) {
      return NextResponse.json({
        demo: false,
        stats: {
          sales: 0,
          revenue: 0,
          netRevenue: 0,
          views: 0,
          downloads: 0,
          listings: 0,
          salesChangePct: null,
          revenueChangePct: null,
        },
        projects: [],
        orders: [],
        monthlyRevenue: [],
        popularProjects: [],
        message: "No seller account in database for this email yet.",
      });
    }

    const projects = await prisma.project.findMany({
      where: { sellerId: seller.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        status: true,
        views: true,
        downloads: true,
        coverImage: true,
        createdAt: true,
        _count: { select: { purchases: true } },
      },
    });

    const projectIds = projects.map((p) => p.id);
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [purchases, txAgg, salesThisMonth, salesLastMonth, revThisMonth, revLastMonth] =
      await Promise.all([
        projectIds.length
          ? prisma.purchase.findMany({
              where: {
                projectId: { in: projectIds },
                paymentStatus: "COMPLETED",
              },
              orderBy: { createdAt: "desc" },
              take: 50,
              include: {
                buyer: { select: { name: true, email: true } },
                project: { select: { title: true, slug: true } },
              },
            })
          : Promise.resolve([]),
        prisma.transaction.aggregate({
          where: { sellerId: seller.id, status: "COMPLETED" },
          _sum: { amount: true, netAmount: true, platformFee: true },
          _count: true,
        }),
        projectIds.length
          ? prisma.purchase.count({
              where: {
                projectId: { in: projectIds },
                paymentStatus: "COMPLETED",
                createdAt: { gte: startThisMonth },
              },
            })
          : 0,
        projectIds.length
          ? prisma.purchase.count({
              where: {
                projectId: { in: projectIds },
                paymentStatus: "COMPLETED",
                createdAt: { gte: startLastMonth, lte: endLastMonth },
              },
            })
          : 0,
        projectIds.length
          ? prisma.purchase.aggregate({
              where: {
                projectId: { in: projectIds },
                paymentStatus: "COMPLETED",
                createdAt: { gte: startThisMonth },
              },
              _sum: { amount: true },
            })
          : { _sum: { amount: 0 } },
        projectIds.length
          ? prisma.purchase.aggregate({
              where: {
                projectId: { in: projectIds },
                paymentStatus: "COMPLETED",
                createdAt: { gte: startLastMonth, lte: endLastMonth },
              },
              _sum: { amount: true },
            })
          : { _sum: { amount: 0 } },
      ]);

    const purchaseRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
    const revenue = txAgg._sum.amount ?? purchaseRevenue;
    const netRevenue =
      txAgg._sum.netAmount ?? calculateFees(purchaseRevenue).netAmount;
    const views = projects.reduce((sum, p) => sum + p.views, 0);
    const downloads = projects.reduce((sum, p) => sum + p.downloads, 0);
    const sales = purchases.length || txAgg._count || 0;

    const revThis = revThisMonth._sum.amount || 0;
    const revLast = revLastMonth._sum.amount || 0;

    function pctChange(current: number, previous: number): number | null {
      if (previous === 0) return current > 0 ? 100 : null;
      return Math.round(((current - previous) / previous) * 100);
    }

    // Last 7 months revenue buckets
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = start.toLocaleString("en", { month: "short" });
      const monthPurchases = purchases.filter((p) => {
        const t = p.createdAt.getTime();
        return t >= start.getTime() && t <= end.getTime();
      });
      // If we only have last 50 purchases, also query aggregate per month for accuracy
      monthlyRevenue.push({
        month: label,
        revenue: monthPurchases.reduce((s, p) => s + p.amount, 0),
      });
    }

    // Recompute monthly with DB for accuracy when there are sales
    if (projectIds.length > 0) {
      for (let i = 0; i < monthlyRevenue.length; i++) {
        const offset = 6 - i;
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const agg = await prisma.purchase.aggregate({
          where: {
            projectId: { in: projectIds },
            paymentStatus: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        });
        monthlyRevenue[i].revenue = agg._sum.amount || 0;
      }
    }

    return NextResponse.json({
      demo: false,
      stats: {
        sales,
        revenue,
        netRevenue,
        views,
        downloads,
        listings: projects.length,
        salesThisMonth,
        salesLastMonth,
        revenueThisMonth: revThis,
        revenueLastMonth: revLast,
        salesChangePct: pctChange(salesThisMonth, salesLastMonth),
        revenueChangePct: pctChange(revThis, revLast),
      },
      projects: projects.slice(0, 8).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        status: p.status,
        views: p.views,
        downloads: p.downloads,
        sales: p._count.purchases,
        coverImage: p.coverImage,
      })),
      orders: purchases.slice(0, 20).map((p) => ({
        id: p.id,
        project: p.project.title,
        slug: p.project.slug,
        buyer: p.buyer.email,
        buyerName: p.buyer.name,
        amount: p.amount,
        status: p.paymentStatus,
        gateway: p.paymentGateway,
        date: p.createdAt.toISOString(),
      })),
      monthlyRevenue,
      popularProjects: projects
        .map((p) => ({
          name: p.title.length > 18 ? `${p.title.slice(0, 16)}…` : p.title,
          sales: p._count.purchases,
          views: p.views,
        }))
        .sort((a, b) => b.sales - a.sales || b.views - a.views)
        .slice(0, 6),
    });
  } catch (err) {
    console.error("[dashboard.stats]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load dashboard stats",
      },
      { status: 500 }
    );
  }
}
