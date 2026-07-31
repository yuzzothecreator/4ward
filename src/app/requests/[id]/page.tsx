"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/use-app-store";
import { categoryLabel, formatPrice } from "@/lib/utils";
import { institutionShort } from "@/lib/tanzania-institutions";

type RequestDetail = {
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
  isBuyer?: boolean;
  buyer: {
    id: string;
    name: string;
    username: string;
    university: string | null;
    avatar: string;
  };
};

type Offer = {
  id: string;
  message: string;
  proposedPrice: number | null;
  deliveryDays: number | null;
  status: string;
  createdAt: string;
  project: { id: string; title: string; slug: string; price: number } | null;
  developer: {
    id: string;
    name: string;
    username: string;
    university: string | null;
    avatar: string;
  };
};

function budgetLabel(min: number | null, max: number | null) {
  if (min == null && max == null) return "Budget flexible";
  if (min != null && max != null) {
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  if (min != null) return `From ${formatPrice(min)}`;
  return `Up to ${formatPrice(max!)}`;
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const user = useAppStore((s) => s.user);
  const listings = useAppStore((s) => s.listings);

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [projectId, setProjectId] = useState("");
  const [offerError, setOfferError] = useState("");

  const emailParam = user?.email
    ? `email=${encodeURIComponent(user.email)}`
    : "";

  const myListings = listings.filter(
    (p) =>
      user &&
      (p.seller.username === user.username ||
        p.seller.id === user.email ||
        p.seller.id === user.username)
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = emailParam ? `?${emailParam}` : "";
      const res = await fetch(`/api/requests/${id}${qs}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load request");
        setRequest(null);
        return;
      }
      setRequest(data.request);
      setOffers(data.offers || []);
      if (data.viewerId) {
        const mine = (data.offers as Offer[]).find(
          (o) => o.developer.id === data.viewerId
        );
        if (mine) {
          setMessage((prev) => prev || mine.message);
          setProposedPrice((prev) =>
            prev || (mine.proposedPrice != null ? String(mine.proposedPrice) : "")
          );
          setDeliveryDays((prev) =>
            prev || (mine.deliveryDays != null ? String(mine.deliveryDays) : "")
          );
          setProjectId((prev) => prev || mine.project?.id || "");
        }
      }
    } catch {
      setError("Network error loading request");
    } finally {
      setLoading(false);
    }
  }, [id, emailParam]);

  useEffect(() => {
    void load();
  }, [load]);

  const isBuyer = Boolean(request?.isBuyer);
  const myOffer = offers.find((o) => user && o.developer.username === user.username);
  const canOffer =
    Boolean(user) &&
    request?.status === "OPEN" &&
    !isBuyer;

  async function submitOffer(e: FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    setBusy(true);
    setOfferError("");
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          message,
          proposedPrice: proposedPrice || null,
          deliveryDays: deliveryDays || null,
          projectId: projectId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOfferError(data.error || "Could not submit offer");
        return;
      }
      setMessage("");
      setProposedPrice("");
      setDeliveryDays("");
      setProjectId("");
      await load();
    } catch {
      setOfferError("Network error submitting offer");
    } finally {
      setBusy(false);
    }
  }

  async function updateOffer(offerId: string, offerStatus: "ACCEPTED" | "DECLINED") {
    if (!user?.email) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          offerId,
          offerStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      await load();
    } catch {
      setError("Network error updating offer");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "OPEN" | "CLOSED" | "FULFILLED") {
    if (!user?.email) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: user.email, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update status");
        return;
      }
      await load();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted">{error || "Request not found"}</p>
        <Link href="/requests" className="mt-4 inline-block">
          <Button>Browse requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/requests" className="text-sm text-muted hover:text-foreground">
        ← All requests
      </Link>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="neon">{categoryLabel(request.category)}</Badge>
            <Badge
              variant={
                request.status === "OPEN"
                  ? "success"
                  : request.status === "FULFILLED"
                    ? "secondary"
                    : "outline"
              }
            >
              {request.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold break-words text-foreground">
            {request.title}
          </h1>
          <p className="whitespace-pre-wrap break-words text-sm text-muted">
            {request.description}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{budgetLabel(request.budgetMin, request.budgetMax)}</span>
            {request.university ? (
              <span>{institutionShort(request.university)}</span>
            ) : null}
            {request.deadline ? (
              <span>Needed by {new Date(request.deadline).toLocaleDateString()}</span>
            ) : null}
            <span>Posted {new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={request.buyer.avatar} />
              <AvatarFallback>{request.buyer.name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{request.buyer.name}</p>
              <p className="truncate text-xs text-muted">@{request.buyer.username}</p>
            </div>
            {isBuyer ? (
              <div className="ml-auto flex flex-wrap gap-2">
                {request.status === "OPEN" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void setStatus("CLOSED")}
                  >
                    Close request
                  </Button>
                ) : request.status === "CLOSED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void setStatus("OPEN")}
                  >
                    Reopen
                  </Button>
                ) : null}
              </div>
            ) : (
              <Link
                href={`/dashboard/messages?peer=${encodeURIComponent(request.buyer.id)}`}
                className="ml-auto"
              >
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4" />
                  Message buyer
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {canOffer ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {myOffer ? "Update your offer" : "Send an offer"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Link href={`/sign-in?next=/requests/${id}`}>
                <Button>Sign in to offer</Button>
              </Link>
            ) : (
              <form className="space-y-3" onSubmit={submitOffer}>
                <div>
                  <Label htmlFor="offer-msg">Your proposal</Label>
                  <Textarea
                    id="offer-msg"
                    className="mt-1.5"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How you'll deliver this, tech stack, what's included…"
                    required
                    minLength={20}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="price">Proposed price (TZS)</Label>
                    <Input
                      id="price"
                      className="mt-1.5"
                      type="number"
                      min={0}
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="days">Delivery (days)</Label>
                    <Input
                      id="days"
                      className="mt-1.5"
                      type="number"
                      min={1}
                      max={365}
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                {myListings.length > 0 ? (
                  <div>
                    <Label htmlFor="listing">Link your listing (optional)</Label>
                    <select
                      id="listing"
                      className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    >
                      <option value="">No linked project</option>
                      {myListings.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {offerError ? (
                  <p className="text-sm text-destructive">{offerError}</p>
                ) : null}
                <Button type="submit" disabled={busy || message.trim().length < 20}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {myOffer ? "Update offer" : "Submit offer"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : !user ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="mb-3 text-sm text-muted">
              Sign in as a developer to send an offer.
            </p>
            <Link href={`/sign-in?next=/requests/${id}`}>
              <Button>Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Offers ({offers.length})
        </h2>
        {offers.length === 0 ? (
          <p className="text-sm text-muted">No offers yet — developers will appear here.</p>
        ) : (
          offers.map((o) => (
            <Card key={o.id}>
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={o.developer.avatar} />
                      <AvatarFallback>{o.developer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {o.developer.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        @{o.developer.username}
                        {o.developer.university
                          ? ` · ${institutionShort(o.developer.university)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      o.status === "ACCEPTED"
                        ? "success"
                        : o.status === "DECLINED"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {o.status}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {o.message}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {o.proposedPrice != null ? (
                    <span>{formatPrice(o.proposedPrice)}</span>
                  ) : null}
                  {o.deliveryDays != null ? (
                    <span>{o.deliveryDays} day{o.deliveryDays === 1 ? "" : "s"}</span>
                  ) : null}
                  {o.project ? (
                    <Link
                      href={`/projects/${o.project.slug}`}
                      className="text-primary hover:underline"
                    >
                      Listing: {o.project.title}
                    </Link>
                  ) : null}
                </div>
                {isBuyer && o.status === "PENDING" && request.status === "OPEN" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void updateOffer(o.id, "ACCEPTED")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void updateOffer(o.id, "DECLINED")}
                    >
                      Decline
                    </Button>
                    <Link
                      href={`/dashboard/messages?peer=${encodeURIComponent(o.developer.id)}`}
                    >
                      <Button size="sm" variant="ghost">
                        Message
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
