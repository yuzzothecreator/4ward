/**
 * Classify audit actions for Super Admin security triage.
 * Higher severity + attack flags surface first in the audit UI.
 */

export type AuditSeverity = "critical" | "high" | "medium" | "low" | "info";

export type AuditCategory =
  | "attack"
  | "auth"
  | "access"
  | "staff"
  | "marketplace"
  | "support"
  | "system";

export type ClassifiedAudit = {
  severity: AuditSeverity;
  category: AuditCategory;
  label: string;
  attackLikely: boolean;
  rank: number; // lower = more urgent
};

const SEVERITY_RANK: Record<AuditSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

/** Exact action → classification */
const ACTION_MAP: Record<
  string,
  Omit<ClassifiedAudit, "rank">
> = {
  "admin.session.denied": {
    severity: "critical",
    category: "attack",
    label: "Failed admin login",
    attackLikely: true,
  },
  "admin.session.issued": {
    severity: "high",
    category: "auth",
    label: "Admin session issued",
    attackLikely: false,
  },
  "admin.user.update": {
    severity: "high",
    category: "staff",
    label: "User / role changed",
    attackLikely: false,
  },
  "admin.user.sync": {
    severity: "low",
    category: "staff",
    label: "Admin user sync",
    attackLikely: false,
  },
  "admin.project.moderate": {
    severity: "medium",
    category: "marketplace",
    label: "Listing moderated",
    attackLikely: false,
  },
  "verification.approve": {
    severity: "medium",
    category: "marketplace",
    label: "Blue tick approved",
    attackLikely: false,
  },
  "verification.reject": {
    severity: "low",
    category: "marketplace",
    label: "Blue tick rejected",
    attackLikely: false,
  },
  "verification.request": {
    severity: "info",
    category: "marketplace",
    label: "Blue tick requested",
    attackLikely: false,
  },
  "support.escalate": {
    severity: "medium",
    category: "support",
    label: "Escalated to Admin",
    attackLikely: false,
  },
  "support.report.resolve": {
    severity: "low",
    category: "support",
    label: "Report resolved",
    attackLikely: false,
  },
  "support.message": {
    severity: "info",
    category: "support",
    label: "Customer desk message",
    attackLikely: false,
  },
};

const ATTACK_HINTS =
  /denied|forbidden|unauthorized|invalid|fail|brute|inject|tamper|spoof|attack|rate.?limit|blocked|suspicious/i;

const AUTH_HINTS = /session|login|auth|password|token|sign.?in/i;
const STAFF_HINTS = /admin\.|role|super.?admin|staff|user\.update/i;
const SUPPORT_HINTS = /^support\.|escalat|report/i;
const MARKET_HINTS = /project|verification|purchase|listing|moderate/i;

export function classifyAuditAction(
  action: string,
  metadata?: unknown
): ClassifiedAudit {
  const exact = ACTION_MAP[action];
  if (exact) {
    return { ...exact, rank: SEVERITY_RANK[exact.severity] };
  }

  const metaStr =
    metadata && typeof metadata === "object"
      ? JSON.stringify(metadata)
      : String(metadata || "");
  const hay = `${action} ${metaStr}`;

  let severity: AuditSeverity = "info";
  let category: AuditCategory = "system";
  let attackLikely = false;
  let label = action;

  if (ATTACK_HINTS.test(hay)) {
    severity = "critical";
    category = "attack";
    attackLikely = true;
    label = "Suspicious / blocked action";
  } else if (AUTH_HINTS.test(hay)) {
    severity = "high";
    category = "auth";
    label = "Auth event";
  } else if (STAFF_HINTS.test(hay)) {
    severity = "medium";
    category = "staff";
    label = "Staff action";
  } else if (SUPPORT_HINTS.test(hay)) {
    severity = "low";
    category = "support";
    label = "Customer desk";
  } else if (MARKET_HINTS.test(hay)) {
    severity = "low";
    category = "marketplace";
    label = "Marketplace";
  } else if (/access|permission|forbidden/i.test(hay)) {
    severity = "high";
    category = "access";
    attackLikely = /forbidden|denied/i.test(hay);
    label = "Access control";
  }

  // Role escalation in metadata is always high
  if (
    metaStr.includes("SUPER_ADMIN") ||
    metaStr.includes('"role":"ADMIN"') ||
    /role.*SUPER_ADMIN|promote/i.test(metaStr)
  ) {
    severity = severity === "critical" ? "critical" : "high";
    category = category === "attack" ? "attack" : "staff";
    label = label === action ? "Privileged role change" : label;
  }

  return {
    severity,
    category,
    label,
    attackLikely,
    rank: SEVERITY_RANK[severity],
  };
}

export function severityBadgeVariant(
  severity: AuditSeverity
): "destructive" | "warning" | "default" | "secondary" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "high") return "warning";
  if (severity === "medium") return "default";
  if (severity === "low") return "secondary";
  return "outline";
}

export const AUDIT_SEVERITY_LABELS: Record<AuditSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  attack: "Attack / threat",
  auth: "Auth",
  access: "Access",
  staff: "Staff",
  marketplace: "Marketplace",
  support: "Customer desk",
  system: "System",
};

/** Sort: attack + critical first, then by time desc (caller passes time). */
export function compareAuditUrgency(
  a: { rank: number; attackLikely: boolean; createdAt: string },
  b: { rank: number; attackLikely: boolean; createdAt: string }
) {
  if (a.attackLikely !== b.attackLikely) return a.attackLikely ? -1 : 1;
  if (a.rank !== b.rank) return a.rank - b.rank;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
