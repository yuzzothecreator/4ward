"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";

export function ClerkSignIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div className="text-sm text-muted">Loading…</div>;
  }

  if (isSignedIn) {
    return <div className="text-sm text-muted">Already signed in — opening dashboard…</div>;
  }

  return (
    <SignIn
      routing="hash"
      signUpUrl="/sign-up"
      forceRedirectUrl="/dashboard"
      fallbackRedirectUrl="/dashboard"
    />
  );
}
