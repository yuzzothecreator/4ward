"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignUp, useAuth } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand-logo";

function safeNext(raw: string | null) {
  if (!raw) return "/welcome";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/welcome";
  return raw;
}

export function ClerkSignUp() {
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
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <BrandLogo size="lg" href={false} />
      <SignUp
        routing="hash"
        signInUrl={`/sign-in${dest !== "/welcome" ? `?next=${encodeURIComponent(dest)}` : ""}`}
        forceRedirectUrl={dest}
        fallbackRedirectUrl={dest}
      />
    </div>
  );
}
