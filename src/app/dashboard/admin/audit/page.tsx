"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/components/auth/require-role";
import { useAppStore } from "@/store/use-app-store";
import { adminHeaders } from "@/lib/admin-session";
import { ensureAdminSessionWithPrompt } from "@/lib/admin-session-client";

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  metadata?: unknown;
};

function AuditInner() {
  const user = useAppStore((s) => s.user);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensureAdminSessionWithPrompt(user);
      const res = await fetch("/api/admin/audit", {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ScrollText className="h-6 w-6 text-primary" />
            Audit log
          </h1>
          <p className="mt-1 text-sm text-muted">
            Super Admin only — security and staff actions across the platform.
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && logs.length === 0 ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted">No audit events yet.</p>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{l.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {l.actorEmail || "system"}
                  {l.entity ? ` · ${l.entity}` : ""}
                  {l.entityId ? ` · ${l.entityId.slice(0, 10)}…` : ""}
                  {l.ipAddress ? ` · ${l.ipAddress}` : ""}
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
