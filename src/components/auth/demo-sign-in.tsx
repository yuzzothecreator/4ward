"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/use-app-store";
import { DEMO_ADMIN_EMAIL, defaultRedirectForRole, isStaffRole } from "@/lib/rbac";
import { clearAdminToken, ensureAdminSession } from "@/lib/admin-session";
import { BrandLogo } from "@/components/brand-logo";

function DemoSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useAppStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || password.length < 6) {
      setError("Enter your email and password (6+ characters).");
      return;
    }

    setLoading(true);
    try {
      const user = signIn({ email });
      if (isStaffRole(user.role)) {
        await ensureAdminSession({ ...user, password });
      } else {
        clearAdminToken();
      }
      const next = searchParams.get("next") || defaultRedirectForRole(user.role);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <div className="mb-3 flex justify-center">
          <BrandLogo size="md" href={false} />
        </div>
        <CardTitle>Sign in to 4ward</CardTitle>
        <CardDescription>
          Access your dashboard. Production admin uses the email from{" "}
          <span className="text-foreground">ADMIN_EMAIL</span> with the bootstrap
          password (12+ chars). Demo hint: {DEMO_ADMIN_EMAIL}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="mt-1.5"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              className="mt-1.5"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function DemoSignIn() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <DemoSignInForm />
    </Suspense>
  );
}
