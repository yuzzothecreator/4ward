"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoUser, setDemoUser } from "@/components/auth/demo-sign-up";

/** Local sign-in when Clerk keys are not configured */
export function DemoSignIn({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || password.length < 6) {
      setError("Enter your email and password (6+ characters).");
      return;
    }

    setLoading(true);
    const existing = getDemoUser();
    const name = existing?.email === email.trim().toLowerCase() ? existing.name : email.split("@")[0];

    setDemoUser({
      name,
      email: email.trim().toLowerCase(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    router.push(redirectTo);
  }

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle>Sign in to 4ward</CardTitle>
        <CardDescription>Access your dashboard, listings, and purchases.</CardDescription>
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
