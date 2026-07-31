import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  type AppRole,
  type Permission,
  hasPermission,
  normalizeRole,
  roleAllowed,
} from "@/lib/rbac";
import { isProductionRuntime } from "@/lib/production";

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
    if (isProductionRuntime()) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error:
              "Authentication is not configured. Set Clerk keys before going live.",
          },
          { status: 503 }
        ),
      };
    }
    // Local demo only: client/store enforces; APIs stay open for local flows
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

  return { ok: true as const, role, demo: false, userId };
}

/**
 * Resolve the signed-in actor for mutating marketplace APIs.
 * Production always requires Clerk. Local demo may fall back to body fields.
 */
export async function resolveApiActor(opts?: {
  fallbackEmail?: string;
  fallbackName?: string;
  fallbackClerkId?: string | null;
}) {
  if (!clerkEnabled) {
    if (isProductionRuntime()) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error:
              "Authentication is not configured. Set Clerk keys before going live.",
          },
          { status: 503 }
        ),
      };
    }
    const email = (opts?.fallbackEmail || "").trim().toLowerCase();
    if (!email) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: "email is required in demo mode" },
          { status: 400 }
        ),
      };
    }
    return {
      ok: true as const,
      demo: true as const,
      userId: null as string | null,
      email,
      name: opts?.fallbackName?.trim() || email.split("@")[0] || "User",
      clerkId: opts?.fallbackClerkId?.trim() || null,
      imageUrl: null as string | null,
    };
  }

  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !clerkUser) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
    "";
  if (!email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Clerk account has no email" },
        { status: 400 }
      ),
    };
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.fullName ||
    clerkUser.username ||
    email.split("@")[0] ||
    "User";

  return {
    ok: true as const,
    demo: false as const,
    userId,
    email,
    name,
    clerkId: userId,
    imageUrl: clerkUser.imageUrl || null,
  };
}

export function hasRole(role: AppRole | undefined | null, allowed: AppRole[]) {
  return roleAllowed(role, allowed);
}
