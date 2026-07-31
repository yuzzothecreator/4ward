"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifiedTick } from "@/components/verified-tick";
import { useAppStore } from "@/store/use-app-store";

type RequestState = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
  evidenceUrl?: string | null;
  adminNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

export default function VerificationPage() {
  const user = useAppStore((s) => s.user);
  const promoteToSeller = useAppStore((s) => s.promoteToSeller);
  const setStoreVerified = useAppStore((s) => s.setVerified);
  const verified = Boolean(user?.verified);
  const [request, setRequest] = useState<RequestState | null>(null);
  const [message, setMessage] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/verification?email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      setStoreVerified(Boolean(data.verified));
      setRequest(data.request || null);
    } catch {
      setError("Could not load verification status");
    } finally {
      setLoading(false);
    }
  }, [user?.email, setStoreVerified]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError("");
    setOk("");
    try {
      promoteToSeller();
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          message,
          evidenceUrl: evidenceUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit request");
        return;
      }
      setOk("Request sent. An admin will review your verification.");
      setMessage("");
      setEvidenceUrl("");
      await load();
    } catch {
      setError("Network error submitting request");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center text-sm text-muted">
        Sign in to request seller verification.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          Blue tick verification
          {verified ? <VerifiedTick className="h-6 w-6" /> : null}
        </h1>
        <p className="mt-1 text-muted">
          Verified sellers earn a blue tick so buyers can trust who they buy from.
          Submit a request — an admin must approve it.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking status…
        </div>
      ) : verified ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <VerifiedTick className="mt-0.5 h-6 w-6" />
            <div>
              <p className="font-medium text-foreground">You are verified</p>
              <p className="mt-1 text-sm text-muted">
                Your blue tick appears on your listings and profile. Keep delivering
                quality projects to stay trusted.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {request?.status === "PENDING" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Request pending
                  <Badge variant="warning">Pending review</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted">
                <p>{request.message}</p>
                {request.evidenceUrl ? (
                  <a
                    href={request.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-2 hover:underline"
                  >
                    Evidence link
                  </a>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(request.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {request?.status === "REJECTED" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Previous request
                  <Badge variant="destructive">Rejected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted">
                <p>
                  {request.adminNote ||
                    "Not approved this time. Update your details and request again."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {request?.status !== "PENDING" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BadgeCheck className="h-5 w-5 text-sky-500" />
                  Request blue tick
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="message">Why should you be verified?</Label>
                    <Textarea
                      id="message"
                      className="mt-1.5"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your university, published projects, GitHub, or other proof buyers can trust…"
                      required
                      minLength={20}
                      maxLength={800}
                    />
                  </div>
                  <div>
                    <Label htmlFor="evidence">Evidence URL (optional)</Label>
                    <Input
                      id="evidence"
                      className="mt-1.5"
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://github.com/you or portfolio link"
                    />
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  {ok ? <p className="text-sm text-success">{ok}</p> : null}
                  <Button type="submit" disabled={submitting || message.trim().length < 20}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Submit for admin approval
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
