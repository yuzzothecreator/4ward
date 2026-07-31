import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="gradient-mesh min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-4xl font-bold text-foreground">About 4ward</h1>
          <p className="mt-4 text-lg text-muted">
            4ward is a Tanzania-first marketplace with two clear shelves:{" "}
            <span className="text-foreground">Campus</span> for student /
            academic projects after presentation, and{" "}
            <span className="text-foreground">Market</span> for real commercial
            products sold by verified creators to companies and developers.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-cyan-500/30">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                Campus
              </p>
              <p className="text-sm text-muted">
                Student price bands, Educational or Source licenses, and
                same-university exclusivity so presentations don’t collide.
              </p>
              <Link href="/marketplace?type=CAMPUS">
                <Button variant="secondary" size="sm" className="mt-2">
                  Browse Campus
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-amber-500/35">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Market
              </p>
              <p className="text-sm text-muted">
                Commercial licenses, company-ready pricing, open to any buyer.
                Sellers must be verified before listing.
              </p>
              <Link href="/marketplace?type=MARKET">
                <Button variant="secondary" size="sm" className="mt-2">
                  Browse Market
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3 p-6 text-foreground/80">
            <h2 className="text-xl font-semibold text-foreground">Our vision</h2>
            <p>
              Campus projects deserve a life beyond the presentation slide —
              and real systems deserve a serious commercial shelf. 4ward keeps
              those paths separate so buyers always know what they’re getting.
            </p>
          </CardContent>
        </Card>

        <section id="security" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Security</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>Role-based access control (Buyer, Seller, Admin)</li>
            <li>Protected downloads with signed URLs</li>
            <li>Verified-seller gate for Market / commercial listings</li>
            <li>Input validation with Zod</li>
            <li>Audit logging for sensitive actions</li>
          </ul>
        </section>

        <section id="terms" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Terms</h2>
          <p className="text-muted">
            Creators retain ownership of their IP and grant buyers rights
            according to the selected license (Source Code, Commercial, or
            Educational). Campus listings may include university exclusivity.
            Market listings are open commercial sales. Platform fee applies to
            paid sales.
          </p>
        </section>

        <section id="privacy" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Privacy</h2>
          <p className="text-muted">
            We process account, purchase, and usage data to operate the
            marketplace. Payment details are handled by ClickPesa (and other
            gateways) — never stored on 4ward servers.
          </p>
        </section>
      </div>
    </div>
  );
}
