"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { DEMO_ADMIN_EMAIL, ROLE_LABELS, type AppRole } from "@/lib/rbac";
import { adminHeaders, ensureAdminSession } from "@/lib/admin-session";

type Stats = {
  users: number;
  sellers: number;
  buyers: number;
  admins: number;
  projects: number;
  publishedProjects: number;
  pendingProjects: number;
  purchases: number;
  purchases30d: number;
  gmv: number;
  gmv30d: number;
  openReports: number;
};

type PendingProject = {
  id: string;
  title: string;
  price: number;
  status: string;
  sellerName: string;
  sellerEmail: string;
};

type UnapprovedSeller = {
  id: string;
  name: string;
  email: string;
  university: string | null;
};

type RecentPurchase = {
  id: string;
  amount: number;
  gateway: string | null;
  buyerName: string;
  buyerEmail: string;
  projectTitle: string;
  createdAt: string;
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isApproved: boolean;
  createdAt: string;
};

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export default function AdminPage() {
  const user = useAppStore((s) => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingProject[]>([]);
  const [sellers, setSellers] = useState<UnapprovedSeller[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditRow[]>([]);
  const [security, setSecurity] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.email || user.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensureAdminSession(user);
      const res = await fetch("/api/admin/stats", {
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load admin stats");
        return;
      }
      setStats(data.stats);
      setPending(data.pendingProjects || []);
      setSellers(data.unapprovedSellers || []);
      setRecentPurchases(data.recentPurchases || []);
      setRecentUsers(data.recentUsers || []);
      setRecentAudit(data.recentAudit || []);
      setSecurity(data.security || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error loading admin data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(projectId: string, status: "PUBLISHED" | "REJECTED") {
    if (!user?.email) return;
    setBusyId(projectId);
    try {
      await ensureAdminSession(user);
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          projectId,
          status,
          rejectionReason: status === "REJECTED" ? "Rejected by admin" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Moderation failed");
        return;
      }
      setPending((prev) => prev.filter((p) => p.id !== projectId));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function approveSeller(userId: string) {
    if (!user?.email) return;
    setBusyId(userId);
    try {
      await ensureAdminSession(user);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          userId,
          isApproved: true,
          role: "SELLER",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Approve failed");
        return;
      }
      setSellers((prev) => prev.filter((s) => s.id !== userId));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>
        <p className="text-muted">
          Sign in as <span className="text-foreground">{DEMO_ADMIN_EMAIL}</span>.
        </p>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>
        <p className="text-muted">
          Admin access required. Your role: {ROLE_LABELS[user.role]}.
        </p>
      </div>
    );
  }

  const cards = stats
    ? [
        { label: "Users", value: String(stats.users) },
        { label: "Published projects", value: String(stats.publishedProjects) },
        { label: "Pending projects", value: String(stats.pendingProjects) },
        { label: "GMV (30d)", value: formatPrice(stats.gmv30d) },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>
          <p className="text-muted">
            Live Postgres metrics — users, sales, listings, and security audit trail.
          </p>
        </div>
        <Link href="/dashboard/admin/users">
          <Button variant="outline" size="sm">
            Manage users
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading real stats…
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (
        <p className="text-xs text-muted-foreground">
          {stats.buyers} buyers · {stats.sellers} sellers · {stats.admins} admins ·{" "}
          {stats.purchases} sales ({stats.purchases30d} in 30d) · total GMV{" "}
          {formatPrice(stats.gmv)} · {stats.openReports} open reports
        </p>
      )}

      {security && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle>Security controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(security).map(([key, on]) => (
              <Badge key={key} variant={on ? "success" : "warning"}>
                {key}: {on ? "on" : "off"}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project approval queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted">No pending listings in the database.</p>
            ) : (
              pending.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sellerName} · {formatPrice(p.price)} · {p.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === p.id}
                      onClick={() => moderate(p.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={() => moderate(p.id, "PUBLISHED")}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sellers.length === 0 ? (
              <p className="text-sm text-muted">No sellers waiting for approval.</p>
            ) : (
              sellers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.university || "—"} · {u.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === u.id}
                    onClick={() => approveSeller(u.id)}
                  >
                    Approve
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent purchases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPurchases.length === 0 ? (
              <p className="text-sm text-muted">No completed purchases yet.</p>
            ) : (
              recentPurchases.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.projectTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.buyerName} · {p.gateway || "payment"} ·{" "}
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(p.amount)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted">No users in the database yet.</p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={u.role === "ADMIN" ? "neon" : "secondary"}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security audit log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted">
              No audit events yet. Admin actions will appear here.
            </p>
          ) : (
            recentAudit.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-foreground">{a.action}</span>
                <span className="text-muted-foreground">
                  {a.entity || "—"}
                  {a.ipAddress ? ` · ${a.ipAddress}` : ""} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
