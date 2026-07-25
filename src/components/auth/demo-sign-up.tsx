"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/use-app-store";
import { DEMO_ADMIN_EMAIL, defaultRedirectForRole } from "@/lib/rbac";

export function DemoSignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signUp = useAppStore((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<"BUYER" | "SELLER">("BUYER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Enter your name, a valid email, and a password (6+ characters).");
      return;
    }

    setLoading(true);
    const user = signUp({
      name,
      email,
      university: university || undefined,
      intent,
    });
    const next = searchParams.get("next") || defaultRedirectForRole(user.role);
    router.push(next);
  }

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle>Create your 4ward account</CardTitle>
        <CardDescription>
          Choose how you&apos;ll use the marketplace. You can sell later anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>I want to</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIntent("BUYER")}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  intent === "BUYER"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted hover:border-foreground/20"
                }`}
              >
                <span className="font-medium text-foreground">Buy projects</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Browse & purchase
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIntent("SELLER")}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  intent === "SELLER"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted hover:border-foreground/20"
                }`}
              >
                <span className="font-medium text-foreground">Sell projects</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  List & earn
                </span>
              </button>
            </div>
          </div>

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
            <Label htmlFor="university">University (optional)</Label>
            <Input
              id="university"
              className="mt-1.5"
              placeholder="University of Dar es Salaam"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Demo admin: sign in as{" "}
            <span className="text-foreground">{DEMO_ADMIN_EMAIL}</span>
          </p>

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
