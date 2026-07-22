import { auth, currentUser } from "@clerk/nextjs/server";

export type AppRole = "BUYER" | "SELLER" | "ADMIN";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getClerkUser() {
  return currentUser();
}

/**
 * Role helpers — when Clerk is configured, roles live in publicMetadata.
 * Falls back to BUYER for demo mode.
 */
export async function getUserRole(): Promise<AppRole> {
  const user = await currentUser();
  if (!user) return "BUYER";
  const role = user.publicMetadata?.role as AppRole | undefined;
  return role || "BUYER";
}

export async function requireRole(allowed: AppRole[]) {
  const role = await getUserRole();
  if (!allowed.includes(role)) {
    throw new Error("Forbidden");
  }
  return role;
}

export function hasRole(role: AppRole | undefined, allowed: AppRole[]) {
  if (!role) return false;
  return allowed.includes(role);
}
