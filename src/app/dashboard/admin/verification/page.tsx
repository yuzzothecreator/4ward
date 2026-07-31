"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireRole } from "@/components/auth/require-role";
import { adminHeaders } from "@/lib/admin-session";
import { ensureAdminSessionWithPrompt } from "@/lib/admin-session-client";
import { useAppStore } from "@/store/use-app-store";

type VerificationRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
  evidenceUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    username: string;
    university: string | null;
    projectsCount: number;
    verified: boolean;
  };
};

export default function AdminVerificationPage() {
  return (
    <RequireRole allowed={["ADMIN"]} fallbackHref="/dashboard">
      <AdminVerificationInner />
    </RequireRole>
  );
}

function AdminVerificationInner() {
  const current = useAppStore((s) => s.user);
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (current?.email) {
        await ensureAdminSessionWithPrompt(current);
      }
      const res = await fetch(`/api/admin/verification?status=${filter}`, {
        headers: adminHeaders(),
        credentials: "same-origin",
      });
      const text = await res.text();
      let data: {
        requests?: VerificationRow[];
        error?: string;
        hint?: string;
      } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(
          res.status === 404
            ? "Verification API not reachable — restart the dev server and try again."
            : `Unexpected response (${res.status})`
        );
        setRows([]);
        return;
      }
      if (!res.ok) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Could not load verification requests"
        );
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error loading requests");
    } finally {
      setLoading(false);
    }
  }, [filter, current]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, action: "APPROVE" | "REJECT") {
    setBusyId(id);
    setError("");
    try {
      if (current?.email) {
        await ensureAdminSessionWithPrompt(current);
      }
      const res = await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify({
          id,
          action,
          adminNote: notes[id] || undefined,
        }),
      });
      const text = await res.text();
      let data: { error?: string; hint?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(`Unexpected response (${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") || "Action failed"
        );
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BadgeCheck className="h-6 w-6 text-sky-500" />
            Seller verification
          </h1>
          <p className="mt-1 text-muted">
            Approve blue ticks only for trusted sellers. Signed in as{" "}
            {current?.email || "admin"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "PENDING" ? "default" : "outline"}
            onClick={() => setFilter("PENDING")}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => setFilter("ALL")}
          >
            All
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading requests…
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted">
            No {filter === "PENDING" ? "pending " : ""}verification requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {r.user.name}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        @{r.user.username}
                      </span>
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.user.email}
                      {r.user.university ? ` · ${r.user.university}` : ""}
                      {` · ${r.user.projectsCount} projects`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === "APPROVED"
                        ? "success"
                        : r.status === "REJECTED"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{r.message}</p>
                {r.evidenceUrl ? (
                  <a
                    href={r.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-sky-500 hover:underline"
                  >
                    Evidence <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Requested {new Date(r.createdAt).toLocaleString()}
                </p>

                {r.status === "PENDING" ? (
                  <div className="space-y-3 border-t border-border pt-3">
                    <Textarea
                      value={notes[r.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      placeholder="Admin note (optional — shown on reject)"
                      className="min-h-[80px]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => void decide(r.id, "APPROVE")}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="h-4 w-4" />
                        )}
                        Approve blue tick
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => void decide(r.id, "REJECT")}
                        disabled={busyId === r.id}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : r.adminNote ? (
                  <p className="text-xs text-muted-foreground">Note: {r.adminNote}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
