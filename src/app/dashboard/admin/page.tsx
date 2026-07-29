"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { DEMO_ADMIN_EMAIL, ROLE_LABELS } from "@/lib/rbac";

type Stats = {
  users: number;
  sellers: number;
  buyers: number;
  admins: number;
  projects: number;
  pendingProjects: number;
  purchases: number;
  gmv: number;
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

export default function AdminPage() {
  const user = useAppStore((s) => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingProject[]>([]);
  const [sellers, setSellers] = useState<UnapprovedSeller[]>([]);
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
      const res = await fetch(
        `/api/admin/stats?actorEmail=${encodeURIComponent(user.email)}`,
        { headers: { "x-admin-email": user.email } }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load admin stats");
        return;
      }
      setStats(data.stats);
      setPending(data.pendingProjects || []);
      setSellers(data.unapprovedSellers || []);
    } catch {
      setError("Network error loading admin data");
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(projectId: string, status: "PUBLISHED" | "REJECTED") {
    if (!user?.email) return;
    setBusyId(projectId);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": user.email,
        },
        body: JSON.stringify({
          actorEmail: user.email,
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
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": user.email,
        },
        body: JSON.stringify({
          actorEmail: user.email,
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
        { label: "Sellers", value: String(stats.sellers) },
        { label: "Pending projects", value: String(stats.pendingProjects) },
        { label: "GMV (completed)", value: formatPrice(stats.gmv) },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>
          <p className="text-muted">
            Live platform data from Postgres — users, listings, and payments.
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
          {stats.buyers} buyers · {stats.admins} admins · {stats.purchases} completed
          purchases · {stats.projects} projects · {stats.openReports} open reports
        </p>
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
    </div>
  );
}
