"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { RequireAuth } from "@/components/auth/require-auth";
import Link from "next/link";

function CheckoutInner() {
  const params = useSearchParams();
  const slug = params.get("project") || "";
  const demo = params.get("demo") === "1";
  const listings = useAppStore((s) => s.listings);
  const getProjectBySlug = useAppStore((s) => s.getProjectBySlug);
  const addPurchase = useAppStore((s) => s.addPurchase);
  const hasPurchased = useAppStore((s) => s.hasPurchased);
  const project = useMemo(() => getProjectBySlug(slug), [slug, listings, getProjectBySlug]);
  const [done, setDone] = useState(false);
  const [method, setMethod] = useState<"stripe" | "mpesa" | "azampay" | "selcom">("stripe");

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

  function completePurchase() {
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
          {demo && (
            <Badge variant="warning" className="w-fit">
              Demo checkout
            </Badge>
          )}
          <p className="text-sm text-muted">Complete your purchase of {project.title}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">{project.title}</span>
            <span className="font-semibold text-foreground">{formatPrice(project.price)}</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment method
            </p>
            {(
              [
                { id: "stripe" as const, label: "Card / Stripe", icon: CreditCard, ready: true },
                { id: "mpesa" as const, label: "M-Pesa", icon: Smartphone, ready: false },
                { id: "azampay" as const, label: "AzamPay", icon: Smartphone, ready: false },
                { id: "selcom" as const, label: "Selcom", icon: Smartphone, ready: false },
              ]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!m.ready}
                onClick={() => m.ready && setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                  method === m.id
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted hover:bg-foreground/5"
                } ${!m.ready ? "opacity-60" : ""}`}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
                {!m.ready && <Badge variant="outline">Soon</Badge>}
              </button>
            ))}
          </div>

          <Button className="w-full" onClick={completePurchase}>
            {project.price === 0 ? "Get free access" : `Pay ${formatPrice(project.price)}`}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Demo mode records the purchase locally so you can download from Purchases.
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
