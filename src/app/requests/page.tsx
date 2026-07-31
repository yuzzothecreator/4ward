"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/use-app-store";
import { categoryLabel, formatPrice } from "@/lib/utils";

type RequestItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number | null;
  budgetMax: number | null;
  university: string | null;
  deadline: string | null;
  status: string;
  createdAt: string;
  offerCount: number;
  buyer: {
    id: string;
    name: string;
    username: string;
    university: string | null;
    avatar: string;
  };
};

const CATEGORIES = [
  "",
  "WEB_APPLICATIONS",
  "MOBILE_APPLICATIONS",
  "ARTIFICIAL_INTELLIGENCE",
  "CYBERSECURITY",
  "IOT",
  "BLOCKCHAIN",
  "DATA_SCIENCE",
  "DATABASE_SYSTEMS",
  "UI_UX_DESIGNS",
];

function budgetLabel(min: number | null, max: number | null) {
  if (min == null && max == null) return "Budget flexible";
  if (min != null && max != null) {
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  if (min != null) return `From ${formatPrice(min)}`;
  return `Up to ${formatPrice(max!)}`;
}

export default function RequestsBoardPage() {
  const user = useAppStore((s) => s.user);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [mine, setMine] = useState(false);

  const emailParam = user?.email
    ? `email=${encodeURIComponent(user.email)}`
    : "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("status", mine ? "ALL" : "OPEN");
        if (mine) params.set("mine", "1");
        if (category) params.set("category", category);
        if (q.trim().length >= 2) params.set("q", q.trim());
        if (emailParam) {
          const email = new URLSearchParams(emailParam).get("email");
          if (email) params.set("email", email);
        }
        const res = await fetch(`/api/requests?${params.toString()}`, {
          credentials: "same-origin",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load requests");
          setRequests([]);
          return;
        }
        setRequests(data.requests || []);
      } catch {
        if (!cancelled) setError("Network error loading requests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, mine, q, emailParam]);

  const emptyCopy = useMemo(() => {
    if (mine) return "You haven’t posted a request yet.";
    return "No open requests right now. Be the first to post what you need.";
  }, [mine]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">Buyer requests</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            What should we build?
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Post the project you need. Developers reply with offers, timelines,
            and ready-made listings — pick the best fit.
          </p>
        </div>
        <Link
          href={user ? "/requests/new" : "/sign-in?next=/requests/new"}
          className="w-full sm:w-auto"
        >
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Post a request
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search requests…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c || "all"} value={c}>
              {c ? categoryLabel(c) : "All categories"}
            </option>
          ))}
        </select>
        {user ? (
          <Button
            type="button"
            variant={mine ? "default" : "outline"}
            size="sm"
            onClick={() => setMine((v) => !v)}
          >
            {mine ? "My requests" : "Show mine"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
        </p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted">{emptyCopy}</p>
            <Link href={user ? "/requests/new" : "/sign-in?next=/requests/new"}>
              <Button size="sm">Post a request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`} className="block">
              <Card className="transition hover:border-foreground/25">
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge variant="neon">{categoryLabel(r.category)}</Badge>
                        <Badge
                          variant={
                            r.status === "OPEN"
                              ? "success"
                              : r.status === "FULFILLED"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <h2 className="text-base font-semibold break-words text-foreground sm:text-lg">
                        {r.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {r.description}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-foreground">
                      {budgetLabel(r.budgetMin, r.budgetMax)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      by {r.buyer.name}
                      {r.university || r.buyer.university
                        ? ` · ${r.university || r.buyer.university}`
                        : ""}
                    </span>
                    <span>{r.offerCount} offer{r.offerCount === 1 ? "" : "s"}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
