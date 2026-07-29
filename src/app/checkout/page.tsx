"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { RequireAuth } from "@/components/auth/require-auth";
import Link from "next/link";

type PayMethod = "clickpesa" | "stripe" | "demo";

type MethodsResponse = {
  methods: Record<
    string,
    { id: string; label: string; description: string; enabled: boolean }
  >;
};

function CheckoutInner() {
  const params = useSearchParams();
  const slug = params.get("project") || "";
  const successFlag = params.get("success") === "1";
  const listings = useAppStore((s) => s.listings);
  const getProjectBySlug = useAppStore((s) => s.getProjectBySlug);
  const addPurchase = useAppStore((s) => s.addPurchase);
  const hasPurchased = useAppStore((s) => s.hasPurchased);
  const user = useAppStore((s) => s.user);
  const project = useMemo(
    () => getProjectBySlug(slug),
    [slug, listings, getProjectBySlug]
  );

  const [methods, setMethods] = useState<MethodsResponse["methods"] | null>(null);
  const [method, setMethod] = useState<PayMethod>("clickpesa");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [channel, setChannel] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/checkout/methods")
      .then((r) => r.json())
      .then((data: MethodsResponse) => {
        setMethods(data.methods);
        if (data.methods?.clickpesa?.enabled) setMethod("clickpesa");
        else if (data.methods?.stripe?.enabled) setMethod("stripe");
        else setMethod("demo");
      })
      .catch(() => setMethod("demo"));
  }, []);

  useEffect(() => {
    if (successFlag && project && !hasPurchased(project.id)) {
      addPurchase(project);
      setDone(true);
    }
  }, [successFlag, project, addPurchase, hasPurchased]);

  useEffect(() => {
    if (!orderReference || !polling || !project) return;

    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const res = await fetch(
          `/api/checkout/mobile-money/status?orderReference=${encodeURIComponent(orderReference)}`
        );
        const data = await res.json();
        if (cancelled) return;

        if (data.paid) {
          addPurchase(project, {
            downloadToken: data.purchase?.downloadToken,
            purchaseId: data.purchase?.id,
          });
          setDone(true);
          setPolling(false);
          setStatusMsg("Payment confirmed — purchase saved.");
          return;
        }

        if (data.status === "FAILED") {
          setPolling(false);
          setError(data.message || "Payment failed or was cancelled on the phone.");
          setStatusMsg("");
          return;
        }

        setStatusMsg(
          data.channel
            ? `Waiting for approval on ${data.channel}…`
            : "Waiting for you to approve the USSD prompt…"
        );
        setChannel(data.channel);

        if (attempts >= 40) {
          setPolling(false);
          setError(
            "Still pending. If you already paid, refresh this page or check Purchases shortly."
          );
        }
      } catch {
        if (!cancelled) setStatusMsg("Checking payment status…");
      }
    };

    tick();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderReference, polling, project, addPurchase]);

  if (!project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted">No project selected.</p>
        <Link href="/marketplace">
          <Button className="mt-4">Browse marketplace</Button>
        </Link>
      </div>
    );
  }

  const alreadyOwned = hasPurchased(project.id);
  const clickpesaReady = Boolean(methods?.clickpesa?.enabled);
  const stripeReady = Boolean(methods?.stripe?.enabled);

  async function payWithClickPesa() {
    setError("");
    setStatusMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project!.id,
          slug: project!.slug,
          title: project!.title,
          price: project!.price,
          phone,
          email: user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start mobile money payment");
        return;
      }
      setOrderReference(data.orderReference);
      setChannel(data.channel);
      setStatusMsg(data.message || "Approve the prompt on your phone.");
      setPolling(true);
    } catch {
      setError("Network error starting ClickPesa payment");
    } finally {
      setLoading(false);
    }
  }

  async function payWithStripe() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project!.id, slug: project!.slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.message || "Stripe checkout unavailable — try mobile money or demo.");
    } catch {
      setError("Stripe checkout failed");
    } finally {
      setLoading(false);
    }
  }

  function completeDemoPurchase() {
    addPurchase(project!);
    setDone(true);
  }

  if (done || alreadyOwned) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="text-2xl font-bold text-foreground">Purchase complete</h1>
        <p className="mt-2 text-muted">
          {project.title} is ready to download from your dashboard.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/purchases">
            <Button>Go to purchases</Button>
          </Link>
          <Link href={`/projects/${project.slug}`}>
            <Button variant="secondary">View project</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <p className="text-sm text-muted">
            Complete your purchase of {project.title}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">{project.title}</span>
            <span className="font-semibold text-foreground">
              {formatPrice(project.price)}
            </span>
          </div>

          {project.price === 0 ? (
            <Button className="w-full" onClick={completeDemoPurchase}>
              Get free access
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Payment method
                </p>
                <button
                  type="button"
                  disabled={!clickpesaReady}
                  onClick={() => clickpesaReady && setMethod("clickpesa")}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                    method === "clickpesa"
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted hover:bg-foreground/5"
                  } ${!clickpesaReady ? "opacity-60" : ""}`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="flex-1">
                    <span className="block font-medium text-foreground">
                      Mobile money
                    </span>
                    <span className="text-xs text-muted-foreground">
                      M-Pesa · Mixx · Airtel · HaloPesa via ClickPesa
                    </span>
                  </span>
                  {clickpesaReady ? (
                    <Badge variant="secondary">Live</Badge>
                  ) : (
                    <Badge variant="outline">Add API keys</Badge>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!stripeReady}
                  onClick={() => stripeReady && setMethod("stripe")}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                    method === "stripe"
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted hover:bg-foreground/5"
                  } ${!stripeReady ? "opacity-60" : ""}`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card / Stripe
                  {!stripeReady && <Badge variant="outline">Optional</Badge>}
                </button>
                {!clickpesaReady && !stripeReady && (
                  <button
                    type="button"
                    onClick={() => setMethod("demo")}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${
                      method === "demo"
                        ? "border-primary bg-primary/15"
                        : "border-border"
                    }`}
                  >
                    Demo checkout (no gateway)
                  </button>
                )}
              </div>

              {method === "clickpesa" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="phone">Mobile money number</Label>
                    <Input
                      id="phone"
                      className="mt-1.5"
                      placeholder="0712 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      disabled={polling || loading}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tanzania numbers only. You&apos;ll get a USSD prompt to enter your PIN.
                    </p>
                  </div>
                  {orderReference && (
                    <p className="text-xs text-muted-foreground">
                      Order ref:{" "}
                      <span className="font-mono text-foreground">{orderReference}</span>
                      {channel ? ` · ${channel}` : ""}
                    </p>
                  )}
                  <Button
                    className="w-full"
                    disabled={loading || polling || !phone.trim()}
                    onClick={payWithClickPesa}
                  >
                    {(loading || polling) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {polling
                      ? "Waiting for phone approval…"
                      : `Pay ${formatPrice(project.price)} with mobile money`}
                  </Button>
                </div>
              )}

              {method === "stripe" && (
                <Button className="w-full" disabled={loading} onClick={payWithStripe}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Pay {formatPrice(project.price)} with card
                </Button>
              )}

              {method === "demo" && (
                <Button className="w-full" onClick={completeDemoPurchase}>
                  Complete demo purchase
                </Button>
              )}
            </>
          )}

          {statusMsg && (
            <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
              {statusMsg}
            </p>
          )}
          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <p className="text-center text-[11px] text-muted-foreground">
            {clickpesaReady
              ? "Powered by ClickPesa — Bank of Tanzania licensed payment gateway."
              : "Set CLICKPESA_CLIENT_ID and CLICKPESA_API_KEY in .env to collect real mobile money."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth redirectTo="/sign-up">
      <Suspense fallback={<div className="p-20 text-center text-muted">Loading checkout...</div>}>
        <CheckoutInner />
      </Suspense>
    </RequireAuth>
  );
}
