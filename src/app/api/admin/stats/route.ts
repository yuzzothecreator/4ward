import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Real platform totals for the admin overview. */
export async function GET(req: Request) {
  const actorEmail =
    req.headers.get("x-admin-email") ||
    new URL(req.url).searchParams.get("actorEmail") ||
    "";
  const gate = await requireAdminActor(actorEmail);
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json(
      { error: db.error || "Database unavailable", demo: true },
      { status: 503 }
    );
  }

  try {
    const prisma = await getPrisma();
    const [
      users,
      sellers,
      buyers,
      admins,
      projects,
      pendingProjects,
      purchases,
      gmv,
      openReports,
      unapprovedSellers,
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
      prisma.purchase.aggregate({
        where: { paymentStatus: "COMPLETED" },
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
    ]);

    const pendingList = await prisma.project.findMany({
      where: { status: { in: ["PENDING_REVIEW", "DRAFT"] } },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      stats: {
        users,
        sellers,
        buyers,
        admins,
        projects,
        pendingProjects,
        purchases,
        gmv: gmv._sum.amount || 0,
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
      demo: gate.demo,
    });
  } catch (err) {
    console.error("[admin.stats]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stats failed" },
      { status: 500 }
    );
  }
}
