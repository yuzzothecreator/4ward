"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectBySlug } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

function CheckoutInner() {
  const params = useSearchParams();
  const slug = params.get("project") || "";
  const demo = params.get("demo") === "1";
  const project = getProjectBySlug(slug);
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

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-success" />
        <h1 className="text-2xl font-bold text-foreground">Purchase complete</h1>
        <p className="mt-2 text-muted">
          {project.title} is ready to download from your dashboard.
        </p>
        <Link href="/dashboard/purchases" className="mt-6">
          <Button>Go to purchases</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="gradient-mesh mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          {demo && (
            <Badge variant="warning" className="w-fit">
              Demo mode
            </Badge>
          )}
          <p className="text-sm text-muted">
            Complete your purchase of {project.title}
          </p>
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
                { id: "stripe" as const, label: "Stripe (Card)", icon: CreditCard, ready: true },
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

          <Button className="w-full" onClick={() => setDone(true)}>
            {project.price === 0 ? "Get free access" : `Pay ${formatPrice(project.price)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-muted">Loading checkout...</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
