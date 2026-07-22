"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/sell", label: "Sell" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const clerkEnabled =
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground shadow-lg shadow-primary/30">
            4
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">ward</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-foreground/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/marketplace">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Sell Project
            </Button>
          </Link>
          {!clerkEnabled && (
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-muted hover:bg-foreground/5 hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border bg-background md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-2">
            <Button variant="secondary" className="w-full">
              Dashboard
            </Button>
          </Link>
          <Link href="/sell" onClick={() => setOpen(false)}>
            <Button className="w-full">Sell Project</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
