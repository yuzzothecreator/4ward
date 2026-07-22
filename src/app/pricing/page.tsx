import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Buyer",
    price: "Free",
    description: "Browse and purchase student projects",
    features: ["Browse marketplace", "Secure downloads", "Wishlist", "Leave reviews"],
  },
  {
    name: "Creator",
    price: "15%",
    description: "Platform fee only on successful sales",
    features: [
      "Unlimited listings",
      "Analytics dashboard",
      "AI description generator",
      "Buyer messaging",
      "Affiliate earnings",
    ],
    highlight: true,
  },
  {
    name: "Campus",
    price: "Custom",
    description: "For universities and innovation hubs",
    features: ["Branded hub", "Bulk verification", "Admin tools", "Priority support"],
  },
];

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="gradient-mesh min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-4xl font-bold text-foreground">Simple, creator-friendly pricing</h1>
        <p className="mt-3 text-muted">No monthly fees for students. We succeed when you sell.</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlight ? "border-primary/50 shadow-[0_0_40px_rgba(59,130,246,0.2)]" : ""}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-4 text-3xl font-bold text-foreground">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.name === "Creator" ? "/sell" : "/marketplace"}>
                <Button className="w-full" variant={plan.highlight ? "default" : "secondary"}>
                  Get started
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
