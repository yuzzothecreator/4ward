"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/requests", label: "Requests" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/sell", label: "Sell" },
];

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function GuestActions({ stacked = false }: { stacked?: boolean }) {
  return (
    <div
      className={cn(
        stacked ? "flex w-full flex-col gap-2" : "flex items-center gap-2"
      )}
    >
      <Link href="/sign-in" className={stacked ? "w-full" : undefined}>
        <Button
          variant="ghost"
          size="sm"
          className={cn("text-[13px]", stacked && "w-full")}
        >
          Log in
        </Button>
      </Link>
      <Link href="/sign-up" className={stacked ? "w-full" : undefined}>
        <Button size="sm" className={cn("text-[13px]", stacked && "w-full")}>
          Sign up
        </Button>
      </Link>
    </div>
  );
}

function DemoUserMenu() {
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  if (!user) return null;

  return (
    <UserMenu
      profile={{
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        verified: Boolean(user.verified),
      }}
      onSignOut={() => signOut()}
    />
  );
}

function ClerkUserMenu() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const storeUser = useAppStore((s) => s.user);
  const storeSignOut = useAppStore((s) => s.signOut);

  async function handleSignOut() {
    storeSignOut();
    await clerkSignOut({ redirectUrl: "/" });
  }

  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" className="text-[13px]" disabled>
        …
      </Button>
    );
  }

  if (!isSignedIn) return null;

  const name =
    storeUser?.name ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    clerkUser?.username ||
    "Account";
  const email =
    storeUser?.email ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "";

  return (
    <UserMenu
      profile={{
        name,
        email,
        username: storeUser?.username,
        role: storeUser?.role,
        avatarUrl: clerkUser?.imageUrl,
        verified: Boolean(storeUser?.verified),
      }}
      onSignOut={handleSignOut}
    />
  );
}

function SignedInMenu() {
  if (clerkEnabled) return <ClerkUserMenu />;
  return <DemoUserMenu />;
}

function DemoDesktopAuth() {
  const user = useAppStore((s) => s.user);
  if (!user) return <GuestActions />;
  return <DemoUserMenu />;
}

function ClerkDesktopAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" className="text-[13px]" disabled>
        …
      </Button>
    );
  }
  if (!isSignedIn) return <GuestActions />;
  return <ClerkUserMenu />;
}

function DesktopAuth() {
  if (clerkEnabled) return <ClerkDesktopAuth />;
  return <DemoDesktopAuth />;
}

function DemoMobileGuestCta() {
  const user = useAppStore((s) => s.user);
  if (user) return null;
  return (
    <div className="mt-2 border-t border-border pt-3">
      <GuestActions stacked />
    </div>
  );
}

function ClerkMobileGuestCta() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return (
    <div className="mt-2 border-t border-border pt-3">
      <GuestActions stacked />
    </div>
  );
}

function MobileGuestCta() {
  if (clerkEnabled) return <ClerkMobileGuestCta />;
  return <DemoMobileGuestCta />;
}

/** Linear-quiet top nav: logo, sparse links, account menu */
export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <BrandLogo size="sm" priority />
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
          <NotificationBell />
          <DesktopAuth />
        </div>

        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <ThemeToggle />
          <NotificationBell />
          <SignedInMenu />
          <button
            className="rounded-md p-2 text-muted hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
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
        <div className="flex flex-col gap-1 px-4 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-2 text-sm text-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div onClick={() => setOpen(false)}>
            <MobileGuestCta />
          </div>
        </div>
      </div>
    </header>
  );
}
