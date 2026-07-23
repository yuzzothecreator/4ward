"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/sell", label: "Sell" },
];

/** Linear-quiet top nav: logo, sparse links, login/CTA */
export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
              4
            </span>
            <span className="text-[15px] font-medium tracking-tight text-foreground">
              ward
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2.5 py-1.5 text-[13px] text-muted transition hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-[13px]">
              Log in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="text-[13px]">
              Sign up
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-md p-2 text-muted hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-border bg-background md:hidden", open ? "block" : "hidden")}>
        <div className="flex flex-col gap-1 px-4 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm text-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/sign-in" onClick={() => setOpen(false)} className="mt-2">
            <Button variant="ghost" className="w-full" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/sign-up" onClick={() => setOpen(false)}>
            <Button className="w-full" size="sm">
              Sign up
            </Button>
          </Link>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Button variant="secondary" className="w-full" size="sm">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
