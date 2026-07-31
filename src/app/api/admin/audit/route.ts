import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireStaffActor } from "@/lib/admin-auth";
import {
  classifyAuditAction,
  compareAuditUrgency,
  type AuditCategory,
  type AuditSeverity,
} from "@/lib/audit-classify";
import { jsonSecure } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit — Super Admin security audit trail (classified).
 * Query: limit, severity, category, attacksOnly=1
 */
export async function GET(req: Request) {
  const gate = await requireStaffActor(req, {
    permission: "admin:audit",
  });
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { error: db.error || "Database unavailable", logs: [], summary: null },
      { status: 503 }
    );
  }

  try {
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("limit") || 150), 300);
    const severityFilter = url.searchParams.get("severity") as AuditSeverity | null;
    const categoryFilter = url.searchParams.get("category") as AuditCategory | null;
    const attacksOnly = url.searchParams.get("attacksOnly") === "1";

    const prisma = await getPrisma();
    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    let logs = rows.map((l) => {
      const classified = classifyAuditAction(l.action, l.metadata);
      return {
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
        severity: classified.severity,
        category: classified.category,
        label: classified.label,
        attackLikely: classified.attackLikely,
        rank: classified.rank,
      };
    });

    const summary = {
      total: logs.length,
      critical: logs.filter((l) => l.severity === "critical").length,
      high: logs.filter((l) => l.severity === "high").length,
      medium: logs.filter((l) => l.severity === "medium").length,
      low: logs.filter((l) => l.severity === "low").length,
      info: logs.filter((l) => l.severity === "info").length,
      attacks: logs.filter((l) => l.attackLikely).length,
      byCategory: {
        attack: logs.filter((l) => l.category === "attack").length,
        auth: logs.filter((l) => l.category === "auth").length,
        access: logs.filter((l) => l.category === "access").length,
        staff: logs.filter((l) => l.category === "staff").length,
        marketplace: logs.filter((l) => l.category === "marketplace").length,
        support: logs.filter((l) => l.category === "support").length,
        system: logs.filter((l) => l.category === "system").length,
      },
    };

    if (attacksOnly) {
      logs = logs.filter((l) => l.attackLikely);
    }
    if (severityFilter) {
      logs = logs.filter((l) => l.severity === severityFilter);
    }
    if (categoryFilter) {
      logs = logs.filter((l) => l.category === categoryFilter);
    }

    logs.sort(compareAuditUrgency);

    return jsonSecure({
      logs,
      summary,
      actorRole: gate.role,
    });
  } catch (err) {
    console.error("[admin.audit]", err);
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Failed to load audit log",
        logs: [],
        summary: null,
      },
      { status: 500 }
    );
  }
}
