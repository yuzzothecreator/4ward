import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="gradient-mesh min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-4xl font-bold text-foreground">About 4ward</h1>
          <p className="mt-4 text-lg text-muted">
            4ward is a digital marketplace where university students, developers, and IT creators
            sell completed academic and personal projects after presentation — monetizing source
            code, documentation, and digital products while buyers discover ready-made solutions.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-6 text-foreground/80">
            <h2 className="text-xl font-semibold text-foreground">Our vision</h2>
            <p>
              Inspired by GitHub Marketplace, Gumroad, Envato, and Product Hunt — with the energy of
              a student innovation hub. We believe campus projects deserve a life beyond the
              presentation slide.
            </p>
          </CardContent>
        </Card>

        <section id="security" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Security</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>Role-based access control (Buyer, Seller, Admin)</li>
            <li>Protected downloads with signed URLs</li>
            <li>Stripe webhook signature verification</li>
            <li>Input validation with Zod</li>
            <li>Audit logging for sensitive actions</li>
          </ul>
        </section>

        <section id="terms" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Terms</h2>
          <p className="text-muted">
            Creators retain ownership of their IP and grant buyers rights according to the selected
            license (Source Code, Commercial, or Educational). Platform fee applies to paid sales.
          </p>
        </section>

        <section id="privacy" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Privacy</h2>
          <p className="text-muted">
            We process account, purchase, and usage data to operate the marketplace. Payment details
            are handled by Stripe (and future African gateways) — never stored on 4ward servers.
          </p>
        </section>
      </div>
    </div>
  );
}
