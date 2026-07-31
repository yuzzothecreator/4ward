"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequireRole } from "@/components/auth/require-role";
import { useAppStore } from "@/store/use-app-store";
import { adminHeaders } from "@/lib/admin-session";
import { ensureAdminSessionWithPrompt } from "@/lib/admin-session-client";
import {
  AUDIT_CATEGORY_LABELS,
  AUDIT_SEVERITY_LABELS,
  severityBadgeVariant,
  type AuditCategory,
  type AuditSeverity,
} from "@/lib/audit-classify";
import { cn } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  metadata?: unknown;
  severity: AuditSeverity;
  category: AuditCategory;
  label: string;
  attackLikely: boolean;
};

type Summary = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  attacks: number;
  byCategory: Record<string, number>;
};

type FilterMode = "all" | "attacks" | AuditSeverity | AuditCategory;

function AuditInner() {
  const user = useAppStore((s) => s.user);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensureAdminSessionWithPrompt(user);
      const params = new URLSearchParams({ limit: "150" });
      if (filter === "attacks") params.set("attacksOnly", "1");
      else if (
        filter === "critical" ||
        filter === "high" ||
        filter === "medium" ||
        filter === "low" ||
        filter === "info"
      ) {
        params.set("severity", filter);
      } else if (
        filter === "attack" ||
        filter === "auth" ||
        filter === "access" ||
        filter === "staff" ||
        filter === "marketplace" ||
        filter === "support" ||
        filter === "system"
      ) {
        params.set("category", filter);
      }

      const res = await fetch(`/api/admin/audit?${params}`, {
        headers: adminHeaders(),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Failed to load audit log"
        );
        return;
      }
      setLogs(data.logs || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const attackPreview = useMemo(
    () => logs.filter((l) => l.attackLikely).slice(0, 5),
    [logs]
  );

  const filterButtons: { id: FilterMode; label: string; count?: number }[] = [
    { id: "all", label: "All", count: summary?.total },
    { id: "attacks", label: "Attacks", count: summary?.attacks },
    { id: "critical", label: "Critical", count: summary?.critical },
    { id: "high", label: "High", count: summary?.high },
    { id: "auth", label: "Auth", count: summary?.byCategory?.auth },
    { id: "staff", label: "Staff", count: summary?.byCategory?.staff },
    {
      id: "marketplace",
      label: "Marketplace",
      count: summary?.byCategory?.marketplace,
    },
    { id: "support", label: "Desk", count: summary?.byCategory?.support },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ScrollText className="h-6 w-6 text-primary" />
            Audit log
          </h1>
          <p className="mt-1 text-sm text-muted">
            Critical and attack-like events are sorted to the top for fast
            triage.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Attacks / blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {summary?.attacks ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary?.critical ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">High</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary?.high ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">
              Events loaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary?.total ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {(summary?.attacks ?? 0) > 0 && filter === "all" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Attack detection — review first
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attackPreview.length === 0 ? (
              <p className="text-sm text-muted">
                Switch to Attacks filter to list them.
              </p>
            ) : (
              attackPreview.map((l) => (
                <div
                  key={l.id}
                  className="rounded-lg border border-destructive/30 bg-background/80 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{l.label}</p>
                  <p className="text-xs text-muted">
                    {l.action} · {l.actorEmail || "unknown"} ·{" "}
                    {l.ipAddress || "no IP"} ·{" "}
                    {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilter("attacks")}
            >
              Show all attacks
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-1">
        {filterButtons.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant={filter === b.id ? "default" : "outline"}
            onClick={() => setFilter(b.id)}
          >
            {b.label}
            {typeof b.count === "number" ? ` (${b.count})` : ""}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Events ({logs.length}) — critical first
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && logs.length === 0 ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted">No matching audit events.</p>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  l.attackLikely
                    ? "border-destructive/50 bg-destructive/5"
                    : l.severity === "critical" || l.severity === "high"
                      ? "border-warning/40 bg-warning/5"
                      : "border-border"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-medium text-foreground">{l.label}</p>
                    <Badge variant={severityBadgeVariant(l.severity)}>
                      {AUDIT_SEVERITY_LABELS[l.severity]}
                    </Badge>
                    <Badge variant="outline">
                      {AUDIT_CATEGORY_LABELS[l.category]}
                    </Badge>
                    {l.attackLikely ? (
                      <Badge variant="destructive">Attack signal</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                  {l.action}
                </p>
                <p className="break-words text-xs text-muted">
                  {l.actorEmail || "system"}
                  {l.actorRole ? ` · ${l.actorRole}` : ""}
                  {l.entity ? ` · ${l.entity}` : ""}
                  {l.entityId ? ` · ${l.entityId.slice(0, 12)}` : ""}
                  {l.ipAddress ? ` · IP ${l.ipAddress}` : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <RequireRole
      roles={["SUPER_ADMIN"]}
      permission="admin:audit"
      fallbackHref="/dashboard/admin"
      message="Audit log is Super Admin only."
    >
      <AuditInner />
    </RequireRole>
  );
}
