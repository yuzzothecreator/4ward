"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_USER_KEY = "4ward_demo_user";

export type DemoUser = {
  name: string;
  email: string;
  createdAt: string;
};

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function setDemoUser(user: DemoUser) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

export function clearDemoUser() {
  localStorage.removeItem(DEMO_USER_KEY);
}

/** Local registration when Clerk keys are not configured */
export function DemoSignUpForm({ redirectTo = "/sell" }: { redirectTo?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Enter your name, email, and a password (6+ characters).");
      return;
    }
    setLoading(true);
    setDemoUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    });
    router.push(redirectTo);
  }

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle>Create your 4ward account</CardTitle>
        <CardDescription>
          Register as a student creator or buyer. You&apos;ll continue to list a project after signup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1.5"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

/** Local sign-in when Clerk keys are not configured */
export function DemoSignInForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || password.length < 6) {
      setError("Enter email and password (6+ characters).");
      return;
    }
    setLoading(true);
    const existing = getDemoUser();
    setDemoUser({
      name: existing?.name || email.split("@")[0],
      email: email.trim().toLowerCase(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    });
    router.push(redirectTo);
  }

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle>Sign in to 4ward</CardTitle>
        <CardDescription>Access your dashboard, purchases, and listings.</CardDescription>
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
              required
              minLength={6}
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
