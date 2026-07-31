"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useAppStore } from "@/store/use-app-store";

/** Ensures guests are sent to sign-in before seeing /welcome */
export function ClerkWelcomeGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const storeUser = useAppStore((s) => s.user);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !storeUser) {
      router.replace("/sign-in?next=/welcome");
    }
  }, [isLoaded, isSignedIn, storeUser, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
