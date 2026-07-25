import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  type AppRole,
  type Permission,
  hasPermission,
  normalizeRole,
  roleAllowed,
} from "@/lib/rbac";

export type { AppRole, Permission };

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export async function requireAuth() {
  if (!clerkEnabled) {
    throw new Error("Unauthorized");
  }
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getClerkUser() {
  if (!clerkEnabled) return null;
  return currentUser();
}

/**
 * Role from Clerk publicMetadata.role when Clerk is on.
 * Demo mode has no server session — use client store / RequireRole instead.
 */
export async function getUserRole(): Promise<AppRole | null> {
  if (!clerkEnabled) return null;
  const user = await currentUser();
  if (!user) return null;
  return normalizeRole(user.publicMetadata?.role, "BUYER");
}

export async function requireRole(allowed: AppRole[]) {
  const role = await getUserRole();
  if (!role || !roleAllowed(role, allowed)) {
    throw new Error("Forbidden");
  }
  return role;
}

export async function requirePermission(permission: Permission) {
  const role = await getUserRole();
  if (!role || !hasPermission(role, permission)) {
    throw new Error("Forbidden");
  }
  return role;
}

/** API-friendly auth gate — returns Response on failure, role on success */
export async function assertApiRole(allowed: AppRole[]) {
  if (!clerkEnabled) {
    // Demo mode: client/store enforces; APIs stay open for local flows
    return { ok: true as const, role: "SELLER" as AppRole, demo: true };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = await getUserRole();
  if (!role || !roleAllowed(role, allowed)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, role, demo: false };
}

export function hasRole(role: AppRole | undefined | null, allowed: AppRole[]) {
  return roleAllowed(role, allowed);
}
