import Link from "next/link";
import { Code2, Share2, Link2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">
              4
            </div>
            <span className="text-lg font-semibold text-foreground">ward</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The student innovation marketplace. Turn academic and personal projects into digital products.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Social">
              <Share2 className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Code">
              <Code2 className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Links">
              <Link2 className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Marketplace</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/marketplace" className="hover:text-primary">Browse Projects</Link></li>
            <li><Link href="/marketplace?category=ARTIFICIAL_INTELLIGENCE" className="hover:text-primary">AI Projects</Link></li>
            <li><Link href="/marketplace?category=WEB_APPLICATIONS" className="hover:text-primary">Web Apps</Link></li>
            <li><Link href="/sell" className="hover:text-primary">Sell Your Project</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Creators</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
            <li><Link href="/dashboard/analytics" className="hover:text-primary">Analytics</Link></li>
            <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
            <li><Link href="/affiliate" className="hover:text-primary">Affiliate Program</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-primary">About</Link></li>
            <li><Link href="/about#security" className="hover:text-primary">Security</Link></li>
            <li><Link href="/about#terms" className="hover:text-primary">Terms</Link></li>
            <li><Link href="/about#privacy" className="hover:text-primary">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} 4ward. Built for student creators.
      </div>
    </footer>
  );
}
