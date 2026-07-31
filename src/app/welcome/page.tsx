"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClerkWelcomeGate } from "@/components/auth/clerk-welcome-gate";
import { useAppStore } from "@/store/use-app-store";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function safeNext(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function WelcomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const storeUser = useAppStore((s) => s.user);

  useEffect(() => {
    if (next) router.replace(next);
  }, [next, router]);

  useEffect(() => {
    if (clerkEnabled) return;
    if (!storeUser) router.replace("/sign-in?next=/welcome");
  }, [storeUser, router]);

  if (next) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Taking you there…
      </div>
    );
  }

  if (storeUser?.role === "ADMIN") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, admin</h1>
        <p className="mt-2 text-sm text-muted">Jump into admin tools or the marketplace.</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/admin" className="flex-1">
            <Button className="w-full">Admin dashboard</Button>
          </Link>
          <Link href="/marketplace" className="flex-1">
            <Button variant="secondary" className="w-full">
              Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">You&apos;re in</h1>
        <p className="mt-2 text-muted">What do you want to do on 4ward?</p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card className="border-border transition hover:border-foreground/25">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
              <ShoppingBag className="h-5 w-5 text-foreground" />
            </div>
            <CardTitle className="text-lg">Browse marketplace</CardTitle>
            <CardDescription>
              Discover student projects, buy source code, and download instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/marketplace">
              <Button className="w-full">
                Explore projects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border transition hover:border-foreground/25">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
              <Store className="h-5 w-5 text-foreground" />
            </div>
            <CardTitle className="text-lg">Start selling</CardTitle>
            <CardDescription>
              List your project, set a price in TZS, and reach buyers across Tanzania.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sell">
              <Button className="w-full" variant="secondary">
                List a project
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Link
        href="/dashboard"
        className="mt-8 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        Or go to your dashboard
      </Link>
    </div>
  );
}

export default function WelcomePage() {
  const body = (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <WelcomeInner />
    </Suspense>
  );

  if (clerkEnabled) {
    return <ClerkWelcomeGate>{body}</ClerkWelcomeGate>;
  }

  return body;
}
