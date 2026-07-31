"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignIn } from "@clerk/nextjs";

function safeNext(raw: string | null) {
  if (!raw) return "/welcome";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/welcome";
  return raw;
}

export function ClerkSignIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dest = safeNext(searchParams.get("next"));

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(dest);
    }
  }, [isLoaded, isSignedIn, router, dest]);

  if (!isLoaded) {
    return <div className="text-sm text-muted">Loading…</div>;
  }

  if (isSignedIn) {
    return <div className="text-sm text-muted">Already signed in — continuing…</div>;
  }

  return (
    <SignIn
      routing="hash"
      signUpUrl={`/sign-up${dest !== "/welcome" ? `?next=${encodeURIComponent(dest)}` : ""}`}
      forceRedirectUrl={dest}
      fallbackRedirectUrl={dest}
    />
  );
}
