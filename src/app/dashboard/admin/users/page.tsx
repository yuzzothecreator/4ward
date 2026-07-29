"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/use-app-store";
import {
  APP_ROLES,
  type AppRole,
  ROLE_LABELS,
  DEMO_ADMIN_EMAIL,
} from "@/lib/rbac";
import { adminHeaders, ensureAdminSession } from "@/lib/admin-session";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: AppRole;
  university: string;
  isApproved: boolean;
  bio?: string | null;
  createdAt: string;
  projectsCount: number;
  purchasesCount: number;
  reviewsCount: number;
  isYou?: boolean;
};

export default function AdminUsersPage() {
  const current = useAppStore((s) => s.user);
  const setRole = useAppStore((s) => s.setRole);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    university: string;
    role: AppRole;
    isApproved: boolean;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "ALL">("ALL");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [demo, setDemo] = useState(false);

  const actorEmail = current?.email || "";

  const loadUsers = useCallback(async () => {
    if (!actorEmail) {
      setError(`Sign in as admin (${DEMO_ADMIN_EMAIL}) to manage users.`);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensureAdminSession(current!);
      const params = new URLSearchParams({
        sessionName: current?.name || "Admin",
        sessionUniversity: current?.university || "",
        sessionUsername: current?.username || "",
      });
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load users");
        setUsers([]);
        return;
      }
      setUsers(data.users || []);
      setDemo(Boolean(data.demo));
      setMessage(
        data.total
          ? `Loaded ${data.total} user${data.total === 1 ? "" : "s"} from the database.`
          : "No users in the database yet."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error loading users");
    } finally {
      setLoading(false);
    }
  }, [actorEmail, current]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.university.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  function startEdit(u: ManagedUser) {
    setEditingId(u.id);
    setEditDraft({
      name: u.name,
      university: u.university === "—" ? "" : u.university,
      role: u.role,
      isApproved: u.isApproved,
    });
  }

  async function saveUser(u: ManagedUser) {
    if (!editDraft || !actorEmail) return;
    setSavingId(u.id);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: adminHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          userId: u.id,
          name: editDraft.name,
          university: editDraft.university,
          role: editDraft.role,
          isApproved: editDraft.isApproved,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setUsers((prev) =>
        prev.map((row) =>
          row.id === u.id
            ? {
                ...row,
                name: data.user.name,
                university: data.user.university,
                role: data.user.role,
                isApproved: data.user.isApproved,
              }
            : row
        )
      );
      if (u.isYou || u.email.toLowerCase() === actorEmail.toLowerCase()) {
        setRole(data.user.role);
      }
      setEditingId(null);
      setEditDraft(null);
      setMessage(`Updated ${data.user.email}`);
    } catch {
      setError("Network error saving user");
    } finally {
      setSavingId(null);
    }
  }

  async function quickApprove(u: ManagedUser, approved: boolean) {
    if (!actorEmail) return;
    setSavingId(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: adminHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          userId: u.id,
          isApproved: approved,
          role: approved && u.role === "BUYER" ? "SELLER" : u.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Approve failed");
        return;
      }
      setUsers((prev) =>
        prev.map((row) =>
          row.id === u.id
            ? {
                ...row,
                isApproved: data.user.isApproved,
                role: data.user.role,
              }
            : row
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  if (!current) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">User management</h1>
        <p className="text-muted">
          Sign in as <span className="text-foreground">{DEMO_ADMIN_EMAIL}</span> to manage real users.
        </p>
      </div>
    );
  }

  if (current.role !== "ADMIN") {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">User management</h1>
        <p className="text-muted">Admin role required. Current role: {ROLE_LABELS[current.role]}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User management</h1>
          <p className="text-muted">
            Live database users — roles, approvals, and profile fields.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {demo && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted">
          Demo admin session — changes still persist to Postgres when the DB is connected.
        </p>
      )}
      {message && <p className="text-sm text-muted">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, username, university…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["ALL", ...APP_ROLES] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={roleFilter === r ? "default" : "outline"}
              onClick={() => setRoleFilter(r)}
            >
              {r === "ALL" ? "All" : ROLE_LABELS[r]}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All users ({filtered.length}
            {filtered.length !== users.length ? ` of ${users.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading from database…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted">
              No users found. Purchases and sign-ups create real rows; refresh after activity.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-foreground">
                        {u.name}
                        {u.isYou ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.email} · @{u.username} · {u.university}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.projectsCount} projects · {u.purchasesCount} purchases ·{" "}
                        {u.reviewsCount} reviews · joined{" "}
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge
                          variant={
                            u.role === "ADMIN"
                              ? "neon"
                              : u.role === "SELLER"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {ROLE_LABELS[u.role]}
                        </Badge>
                        <Badge variant={u.isApproved ? "success" : "warning"}>
                          {u.isApproved ? "Approved" : "Pending approval"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!u.isApproved && (
                        <Button
                          size="sm"
                          disabled={savingId === u.id}
                          onClick={() => quickApprove(u, true)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      {u.isApproved && u.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === u.id}
                          onClick={() => quickApprove(u, false)}
                        >
                          Revoke
                        </Button>
                      )}
                      {editingId === u.id ? null : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(u)}
                        >
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>

                  {editingId === u.id && editDraft && (
                    <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          className="mt-1.5"
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>University</Label>
                        <Input
                          className="mt-1.5"
                          value={editDraft.university}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              university: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {APP_ROLES.map((role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant={
                                editDraft.role === role ? "default" : "outline"
                              }
                              onClick={() =>
                                setEditDraft({ ...editDraft, role })
                              }
                            >
                              {ROLE_LABELS[role]}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Seller / account approval</Label>
                        <div className="mt-1.5 flex gap-1">
                          <Button
                            size="sm"
                            variant={editDraft.isApproved ? "default" : "outline"}
                            onClick={() =>
                              setEditDraft({ ...editDraft, isApproved: true })
                            }
                          >
                            Approved
                          </Button>
                          <Button
                            size="sm"
                            variant={!editDraft.isApproved ? "default" : "outline"}
                            onClick={() =>
                              setEditDraft({ ...editDraft, isApproved: false })
                            }
                          >
                            Pending
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:col-span-2">
                        <Button
                          size="sm"
                          disabled={savingId === u.id}
                          onClick={() => saveUser(u)}
                        >
                          {savingId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Save to database
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
