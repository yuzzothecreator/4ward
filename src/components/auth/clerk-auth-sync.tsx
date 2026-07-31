"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAppStore } from "@/store/use-app-store";
import { clearAdminToken, ensureAdminSession } from "@/lib/admin-session";
import { isStaffRole } from "@/lib/rbac";

/**
 * Keeps Zustand profile + Supabase/Postgres User in sync with Clerk.
 * One Clerk account → one DB row (linked by email + real clerkId).
 */
export function ClerkAuthSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const storeUser = useAppStore((s) => s.user);
  const signIn = useAppStore((s) => s.signIn);
  const signOut = useAppStore((s) => s.signOut);
  const setRole = useAppStore((s) => s.setRole);
  const setVerified = useAppStore((s) => s.setVerified);
  const lastSyncedEmail = useRef<string | null>(null);
  const syncing = useRef(false);

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

      const needsLocal =
        !storeUser || storeUser.email !== email || lastSyncedEmail.current !== email;

      if (needsLocal) {
        const user = signIn({ email, name });
        lastSyncedEmail.current = email;
        void (async () => {
          if (syncing.current) return;
          syncing.current = true;
          try {
            // Link Clerk → single Postgres user (no duplicate local_ row)
            const res = await fetch("/api/users/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.user?.role) {
              setRole(data.user.role);
            }
            if (res.ok && typeof data.user?.verified === "boolean") {
              setVerified(Boolean(data.user.verified));
            }
            const nextRole = data.user?.role || user.role;
            if (isStaffRole(nextRole)) {
              await ensureAdminSession({
                email,
                name: data.user?.name || name,
                username: data.user?.username || user.username,
                university: data.user?.university || user.university,
              });
            } else {
              clearAdminToken();
            }
          } catch {
            if (isStaffRole(user.role)) {
              try {
                await ensureAdminSession(user);
              } catch {
                /* ignore */
              }
            } else {
              clearAdminToken();
            }
          } finally {
            syncing.current = false;
          }
        })();
      } else {
        lastSyncedEmail.current = email;
      }
      return;
    }

    if (lastSyncedEmail.current || storeUser) {
      lastSyncedEmail.current = null;
      signOut();
    }
  }, [isLoaded, isSignedIn, clerkUser, storeUser, signIn, signOut, setRole, setVerified]);

  return null;
}
