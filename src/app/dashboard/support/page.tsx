"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { ROLE_LABELS, type AppRole, hasPermission } from "@/lib/rbac";
import { adminHeaders } from "@/lib/admin-session";
import { ensureAdminSessionWithPrompt } from "@/lib/admin-session-client";

type SupportUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: AppRole;
  university: string | null;
  isApproved: boolean;
  createdAt: string;
};

type SupportPurchase = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  projectTitle: string;
  projectSlug: string;
};

export default function SupportPage() {
  const user = useAppStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<SupportUser[]>([]);
  const [purchases, setPurchases] = useState<SupportPurchase[]>([]);
  const [counts, setCounts] = useState({
    openReports: 0,
    pendingVerification: 0,
  });

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensureAdminSessionWithPrompt(user);
      const res = await fetch("/api/support/overview", {
        headers: adminHeaders(),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Failed to load support desk"
        );
        return;
      }
      setUsers(data.recentUsers || []);
      setPurchases(data.recentPurchases || []);
      setCounts(data.counts || { openReports: 0, pendingVerification: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const canAdmin = hasPermission(user?.role, "admin:access");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Headphones className="h-6 w-6 text-primary" />
            Customer service
          </h1>
          <p className="mt-1 text-sm text-muted">
            Read-only help desk — recent users and orders. Role changes and
            listing moderation need Admin.
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">
              Open reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{counts.openReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">
              Pending blue ticks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {counts.pendingVerification}
            </p>
            {canAdmin && (
              <Link
                href="/dashboard/admin/verification"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Review in Admin →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && users.length === 0 ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted">No users yet.</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent purchases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && purchases.length === 0 ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : purchases.length === 0 ? (
              <p className="text-sm text-muted">No purchases yet.</p>
            ) : (
              purchases.map((p) => (
                <div
                  key={p.id}
                  className="border-b border-border/60 pb-2 last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {p.projectTitle}
                    </p>
                    <Badge variant="secondary">{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {p.buyerName} · {p.buyerEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    TZS {Number(p.amount).toLocaleString()} ·{" "}
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
