import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

/** Platform plans — Campus stays student-friendly; Market & Enterprise are higher. */
const plans = [
  {
    id: "campus",
    name: "Campus",
    badge: "Students",
    icon: GraduationCap,
    price: "10%",
    priceNote: "fee on each sale",
    description:
      "For academic projects sold to students for coursework and presentations.",
    features: [
      "Campus listing badge",
      "4-month same-university exclusivity",
      "Student-friendly price band",
      "Secure digital delivery",
      "Buyer messaging & reviews",
    ],
    cta: "Sell on Campus",
    href: "/sell",
    highlight: false,
  },
  {
    id: "market",
    name: "Market",
    badge: "Commercial",
    icon: Briefcase,
    price: "15%",
    priceNote: "fee on each sale",
    description:
      "For real products and systems any company or developer can buy and use.",
    features: [
      "Commercial listing badge",
      "Verified seller required",
      "No campus exclusivity lock",
      "Open to companies & freelancers",
      "Commercial license options",
      "Analytics & payouts",
      "Priority listing placement",
    ],
    cta: "Sell on Market",
    href: "/sell",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Companies",
    icon: Building2,
    price: "Custom",
    priceNote: "from TZS 2M+ deals",
    description:
      "For production systems, bulk licenses, and institutional procurement.",
    features: [
      "Enterprise & invoice-ready deals",
      "Dedicated seller verification",
      "Custom contracts & support SLAs",
      "Volume / site licenses",
      "Optional shipping for hardware kits",
      "Account manager on large deals",
    ],
    cta: "Talk to us",
    href: "/about",
    highlight: false,
  },
] as const;

/** Suggested seller price bands by listing category (TZS). */
const priceBands = [
  {
    category: "Campus",
    audience: "Students · presentations",
    range: "TZS 50k – 250k",
    note: "Coursework / demo scope, not production rights",
  },
  {
    category: "Market",
    audience: "Developers · startups",
    range: "TZS 500k – 5M",
    note: "Real usable product with commercial license",
  },
  {
    category: "Enterprise",
    audience: "Companies · institutions",
    range: "TZS 5M – 50M+",
    note: "Full system, support, customization, multi-seat",
  },
] as const;

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="gradient-mesh min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs text-muted-foreground">Pricing</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Campus prices for students. Market prices for real products.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] text-muted">
          Not every listing is for a university presentation. Choose the category
          that matches what you sell — student campus work stays affordable;
          commercial and enterprise systems price for real use.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col",
                plan.highlight &&
                  "border-primary/50 shadow-[0_0_40px_var(--primary-glow)]"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={plan.highlight ? "default" : "secondary"}>
                    {plan.badge}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.priceNote}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4">
                <ul className="flex-1 space-y-2 text-sm text-muted">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="block">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "secondary"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mx-auto mt-16 max-w-5xl">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
            Suggested listing price bands
          </h2>
          <p className="mt-1 text-sm text-muted">
            Guide for sellers — Campus stays presentation-priced; Market and
            Enterprise reflect real product value.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {priceBands.map((band) => (
            <div
              key={band.category}
              className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {band.category}
              </p>
              <p className="mt-2 text-lg font-semibold text-primary">
                {band.range}
              </p>
              <p className="mt-1 text-sm text-foreground">{band.audience}</p>
              <p className="mt-2 text-xs text-muted">{band.note}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
        Platform fees are taken only on successful sales. No monthly subscription
        for Campus or Market creators.
      </p>
    </div>
  );
}
