import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireStaffActor } from "@/lib/admin-auth";
import { type AppRole } from "@/lib/rbac";
import { jsonSecure } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/support/overview
 * Customer service: recent users + purchases (read-only).
 */
export async function GET(req: Request) {
  const gate = await requireStaffActor(req, {
    permission: "support:access",
  });
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
    const [recentUsers, recentPurchases, openReports, pendingVerification] =
      await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            university: true,
            isApproved: true,
            createdAt: true,
          },
        }),
        prisma.purchase.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amount: true,
            paymentStatus: true,
            createdAt: true,
            buyer: { select: { name: true, email: true } },
            project: { select: { title: true, slug: true } },
          },
        }),
        prisma.report.count({
          where: { status: { in: ["OPEN", "REVIEWING"] } },
        }),
        prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      ]);

    return jsonSecure({
      actorRole: gate.role,
      actorEmail: gate.actorEmail,
      counts: {
        openReports,
        pendingVerification,
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        role: u.role as AppRole,
        createdAt: u.createdAt.toISOString(),
      })),
      recentPurchases: recentPurchases.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.paymentStatus,
        createdAt: p.createdAt.toISOString(),
        buyerName: p.buyer.name,
        buyerEmail: p.buyer.email,
        projectTitle: p.project.title,
        projectSlug: p.project.slug,
      })),
    });
  } catch (err) {
    console.error("[support.overview]", err);
    return jsonSecure(
      {
        error:
          err instanceof Error ? err.message : "Failed to load support data",
      },
      { status: 500 }
    );
  }
}
