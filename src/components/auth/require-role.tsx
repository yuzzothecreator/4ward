"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import {
  type AppRole,
  type Permission,
  hasPermission,
  roleAllowed,
} from "@/lib/rbac";

type RequireRoleProps = {
  children: React.ReactNode;
  /** At least one of these roles is required */
  roles?: AppRole[];
  /** At least one permission is required */
  permission?: Permission;
  /** Where to send unauthorized users */
  fallbackHref?: string;
  /** Message while redirecting */
  message?: string;
};

/**
 * Client RBAC gate — checks store user role/permissions (works with Clerk sync + demo).
 */
export function RequireRole({
  children,
  roles,
  permission,
  fallbackHref = "/dashboard",
  message = "You don’t have access to this area.",
}: RequireRoleProps) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const allowed =
    !!user &&
    (roles ? roleAllowed(user.role, roles) : true) &&
    (permission ? hasPermission(user.role, permission) : true);

  useEffect(() => {
    if (!user) {
      if (!clerkEnabled) {
        const next = encodeURIComponent(
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/dashboard"
        );
        router.replace(`/sign-in?next=${next}`);
      }
      return;
    }
    if (!allowed) {
      router.replace(fallbackHref);
    }
  }, [user, allowed, clerkEnabled, router, fallbackHref]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-muted">
          {clerkEnabled ? "Loading your account…" : message}
        </p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-muted">{message}</p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}
