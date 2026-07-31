import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireStaffActor } from "@/lib/admin-auth";
import { jsonSecure } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit — Super Admin security audit trail.
 */
export async function GET(req: Request) {
  const gate = await requireStaffActor(req, {
    permission: "admin:audit",
  });
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { error: db.error || "Database unavailable", logs: [] },
      { status: 503 }
    );
  }

  try {
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("limit") || 80), 200);
    const prisma = await getPrisma();
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    return jsonSecure({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
        actorName: l.user?.name || null,
        actorEmail: l.user?.email || null,
        actorRole: l.user?.role || null,
      })),
      actorRole: gate.role,
    });
  } catch (err) {
    console.error("[admin.audit]", err);
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Failed to load audit log",
        logs: [],
      },
      { status: 500 }
    );
  }
}
