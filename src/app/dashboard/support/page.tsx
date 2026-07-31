"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Headphones,
  Loader2,
  RefreshCw,
  Send,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
};

type SupportReport = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
  reporterId: string;
  projectTitle: string | null;
};

type SupportMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
  receiver: { id: string; name: string; email: string };
};

export default function SupportPage() {
  const user = useAppStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [users, setUsers] = useState<SupportUser[]>([]);
  const [purchases, setPurchases] = useState<SupportPurchase[]>([]);
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [conversations, setConversations] = useState<SupportMessage[]>([]);
  const [counts, setCounts] = useState({
    openReports: 0,
    pendingVerification: 0,
    openEscalations: 0,
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [chatText, setChatText] = useState("");
  const [escalateNote, setEscalateNote] = useState("");

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
            "Failed to load customer desk"
        );
        return;
      }
      setUsers(data.recentUsers || []);
      setPurchases(data.recentPurchases || []);
      setReports(data.reports || []);
      setConversations(data.conversations || []);
      setCounts(
        data.counts || {
          openReports: 0,
          pendingVerification: 0,
          openEscalations: 0,
        }
      );
      if (!selectedUserId && (data.recentUsers || [])[0]?.id) {
        setSelectedUserId(data.recentUsers[0].id);
      } else if (
        selectedUserId &&
        !(data.recentUsers || []).some(
          (u: SupportUser) => u.id === selectedUserId
        )
      ) {
        setSelectedUserId(data.recentUsers?.[0]?.id || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(body: Record<string, unknown>) {
    if (!user?.email) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      await ensureAdminSessionWithPrompt(user);
      const res = await fetch("/api/support/overview", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") || "Action failed"
        );
        return;
      }
      setOk("Saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  const canAdmin = hasPermission(user?.role, "admin:access");
  const canChat = hasPermission(user?.role, "support:chat");
  const canResolve = hasPermission(user?.role, "support:resolve");
  const canEscalate = hasPermission(user?.role, "support:escalate");
  const selected = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Headphones className="h-6 w-6 text-primary" />
            Customer desk
          </h1>
          <p className="mt-1 text-sm text-muted">
            Help users, resolve issues, and escalate to Admin when needed. Super
            Admin accounts stay hidden from this desk.
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
      {ok && <p className="text-sm text-primary">{ok}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
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
              Escalations (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{counts.openEscalations}</p>
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
            <CardTitle className="text-base">Help a user</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-xs text-muted">Select user</label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.email} ({ROLE_LABELS[u.role]})
                </option>
              ))}
            </select>

            {canChat && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reply from Customer desk…"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  disabled={busy || !chatText.trim() || !selectedUserId}
                  onClick={() =>
                    runAction({
                      action: "message_user",
                      receiverId: selectedUserId,
                      content: chatText,
                    }).then(() => setChatText(""))
                  }
                >
                  <Send className="h-4 w-4" />
                  Send message
                </Button>
              </div>
            )}

            {canEscalate && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted">
                  Escalate to Admin (not Super Admin) if the user needs admin
                  help.
                </p>
                <Textarea
                  placeholder="Why escalate? (min 10 characters)"
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  rows={2}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || escalateNote.trim().length < 10}
                  onClick={() =>
                    runAction({
                      action: "escalate_to_admin",
                      userId: selectedUserId,
                      note: escalateNote,
                    }).then(() => setEscalateNote(""))
                  }
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Escalate to Admin
                </Button>
              </div>
            )}

            {selected && (
              <p className="text-xs text-muted-foreground">
                Helping {selected.name} · @{selected.username}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-muted">No open reports.</p>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.reason}</p>
                      <p className="text-xs text-muted">
                        {r.reporterName} · {r.reporterEmail}
                      </p>
                      {r.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="warning">{r.status}</Badge>
                  </div>
                  {canResolve && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          runAction({
                            action: "resolve_report",
                            reportId: r.id,
                            status: "RESOLVED",
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          runAction({
                            action: "resolve_report",
                            reportId: r.id,
                            status: "DISMISSED",
                          })
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted">No messages yet.</p>
            ) : (
              conversations.slice(0, 12).map((m) => (
                <div
                  key={m.id}
                  className="border-b border-border/60 pb-2 text-sm last:border-0"
                >
                  <p className="text-xs text-muted">
                    {m.sender.name} → {m.receiver.name}
                  </p>
                  <p className="line-clamp-2">{m.content}</p>
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
            {purchases.length === 0 ? (
              <p className="text-sm text-muted">No purchases yet.</p>
            ) : (
              purchases.map((p) => (
                <div
                  key={p.id}
                  className="border-b border-border/60 pb-2 last:border-0"
                >
                  <p className="truncate text-sm font-medium">{p.projectTitle}</p>
                  <p className="text-xs text-muted">
                    {p.buyerName} · {p.buyerEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    TZS {Number(p.amount).toLocaleString()} · {p.status}
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
