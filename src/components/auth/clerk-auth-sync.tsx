"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAppStore } from "@/store/use-app-store";
import { clearAdminToken, ensureAdminSession } from "@/lib/admin-session";

/**
 * Keeps the Zustand profile in sync with the live Clerk session
 * so nav/profile stop showing "Log in" after a successful sign-in.
 */
export function ClerkAuthSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const storeUser = useAppStore((s) => s.user);
  const signIn = useAppStore((s) => s.signIn);
  const signOut = useAppStore((s) => s.signOut);
  const lastSyncedEmail = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      const email =
        clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
        clerkUser.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
        "";
      if (!email) return;

      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
        clerkUser.fullName ||
        clerkUser.username ||
        email.split("@")[0] ||
        "User";

      // Only rewrite the store when session identity changes
      if (!storeUser || storeUser.email !== email) {
        const user = signIn({ email, name });
        lastSyncedEmail.current = email;
        void (async () => {
          if (user.role === "ADMIN") {
            await ensureAdminSession(user);
          } else {
            clearAdminToken();
          }
        })();
      } else {
        lastSyncedEmail.current = email;
      }
      return;
    }

    // Clerk session ended — clear local profile so UI shows Log in again
    if (lastSyncedEmail.current || storeUser) {
      lastSyncedEmail.current = null;
      signOut();
    }
  }, [isLoaded, isSignedIn, clerkUser, storeUser, signIn, signOut]);

  return null;
}
