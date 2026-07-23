"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";

/** Redirect guests to sign-up (demo auth) so sell/buy stay valid */
export function RequireAuth({
  children,
  redirectTo = "/sign-up",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    // Clerk mode: middleware protects routes when keys exist
    if (clerkEnabled) return;
    if (!user) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname + window.location.search : redirectTo
      );
      router.replace(`${redirectTo}?next=${next}`);
    }
  }, [user, clerkEnabled, router, redirectTo]);

  if (!clerkEnabled && !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted">
        Redirecting to sign up…
      </div>
    );
  }

  return <>{children}</>;
}
