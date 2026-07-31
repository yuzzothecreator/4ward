import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/requests", label: "Requests" },
      { href: "/sell", label: "Sell" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Features",
    links: [
      { href: "/#product", label: "Automation" },
      { href: "/dashboard/analytics", label: "Analytics" },
      { href: "/dashboard/messages", label: "Messaging" },
      { href: "/affiliate", label: "Affiliate" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#security", label: "Security" },
      { href: "/about#terms", label: "Terms" },
      { href: "/about#privacy", label: "Privacy" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/sign-in", label: "Log in" },
      { href: "/sign-up", label: "Sign up" },
      { href: "/sell", label: "Sell a project" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

/** Linear-style multi-column footer */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
                4
              </span>
              <span className="text-[15px] font-medium text-foreground">ward</span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
              The product system for campus creators. Sell source, docs, and demos after presentation.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-medium text-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-muted transition hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} 4ward
          </p>
          <div className="flex gap-4 text-[12px] text-muted-foreground">
            <Link href="/about#privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/about#terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/about#security" className="hover:text-foreground">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
