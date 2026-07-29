import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth";
import { jsonSecure } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Real platform totals + recent activity for the admin overview. */
export async function GET(req: Request) {
  const gate = await requireAdminActor(req);
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { error: db.error || "Database unavailable", demo: true },
      { status: 503 }
    );
  }

  try {
    const prisma = await getPrisma();
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      users,
      sellers,
      buyers,
      admins,
      projects,
      pendingProjects,
      purchases,
      purchases30d,
      gmv,
      gmv30d,
      openReports,
      unapprovedSellers,
      pendingList,
      recentPurchases,
      recentUsers,
      recentAudit,
      publishedProjects,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.project.count(),
      prisma.project.count({
        where: { status: { in: ["PENDING_REVIEW", "DRAFT"] } },
      }),
      prisma.purchase.count({ where: { paymentStatus: "COMPLETED" } }),
      prisma.purchase.count({
        where: { paymentStatus: "COMPLETED", createdAt: { gte: since30d } },
      }),
      prisma.purchase.aggregate({
        where: { paymentStatus: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.purchase.aggregate({
        where: { paymentStatus: "COMPLETED", createdAt: { gte: since30d } },
        _sum: { amount: true },
      }),
      prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
      prisma.user.findMany({
        where: { role: "SELLER", isApproved: false },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          university: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        where: { status: { in: ["PENDING_REVIEW", "DRAFT"] } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          seller: { select: { name: true, email: true } },
        },
      }),
      prisma.purchase.findMany({
        where: { paymentStatus: "COMPLETED" },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { name: true, email: true } },
          project: { select: { title: true, slug: true } },
        },
      }),
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          isApproved: true,
        },
      }),
      prisma.auditLog.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          ipAddress: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.project.count({
        where: { status: { in: ["PUBLISHED", "APPROVED"] } },
      }),
    ]);

    return jsonSecure({
      stats: {
        users,
        sellers,
        buyers,
        admins,
        projects,
        publishedProjects,
        pendingProjects,
        purchases,
        purchases30d,
        gmv: gmv._sum.amount || 0,
        gmv30d: gmv30d._sum.amount || 0,
        openReports,
      },
      pendingProjects: pendingList.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        status: p.status,
        sellerName: p.seller.name,
        sellerEmail: p.seller.email,
      })),
      unapprovedSellers,
      recentPurchases: recentPurchases.map((p) => ({
        id: p.id,
        amount: p.amount,
        gateway: p.paymentGateway,
        buyerName: p.buyer.name,
        buyerEmail: p.buyer.email,
        projectTitle: p.project.title,
        projectSlug: p.project.slug,
        createdAt: p.createdAt.toISOString(),
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isApproved: u.isApproved,
        createdAt: u.createdAt.toISOString(),
      })),
      recentAudit: recentAudit.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        ipAddress: a.ipAddress,
        createdAt: a.createdAt.toISOString(),
      })),
      security: {
        adminTokenRequired: true,
        sameOriginMutations: true,
        rateLimited: true,
        auditLogging: true,
      },
      demo: gate.demo,
    });
  } catch (err) {
    console.error("[admin.stats]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Stats failed" },
      { status: 500 }
    );
  }
}
