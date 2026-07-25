/**
 * Marketplace RBAC — BUYER | SELLER | ADMIN
 * Shared by client UI gates and server auth helpers.
 */

export type AppRole = "BUYER" | "SELLER" | "ADMIN";

export type Permission =
  | "marketplace:browse"
  | "marketplace:purchase"
  | "listings:create"
  | "listings:manage_own"
  | "dashboard:buyer"
  | "dashboard:seller"
  | "admin:access"
  | "admin:users"
  | "admin:approvals";

export const APP_ROLES: AppRole[] = ["BUYER", "SELLER", "ADMIN"];

const BUYER_PERMISSIONS: Permission[] = [
  "marketplace:browse",
  "marketplace:purchase",
  "dashboard:buyer",
];

const SELLER_PERMISSIONS: Permission[] = [
  ...BUYER_PERMISSIONS,
  "listings:create",
  "listings:manage_own",
  "dashboard:seller",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...SELLER_PERMISSIONS,
  "admin:access",
  "admin:users",
  "admin:approvals",
];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  BUYER: BUYER_PERMISSIONS,
  SELLER: SELLER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  ADMIN: "Admin",
};

/** Demo shortcut: this email always signs in as ADMIN */
export const DEMO_ADMIN_EMAIL = "admin@4ward.com";

export function isAppRole(value: unknown): value is AppRole {
  return value === "BUYER" || value === "SELLER" || value === "ADMIN";
}

export function normalizeRole(value: unknown, fallback: AppRole = "BUYER"): AppRole {
  return isAppRole(value) ? value : fallback;
}

export function roleFromEmail(email: string, preferred?: AppRole): AppRole {
  if (email.trim().toLowerCase() === DEMO_ADMIN_EMAIL) return "ADMIN";
  return preferred || "BUYER";
}

export function hasPermission(role: AppRole | null | undefined, permission: Permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: AppRole | null | undefined,
  permissions: Permission[]
) {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: AppRole | null | undefined,
  permissions: Permission[]
) {
  return permissions.every((p) => hasPermission(role, p));
}

/** True if `role` is allowed when route requires one of `allowed` */
export function roleAllowed(role: AppRole | null | undefined, allowed: AppRole[]) {
  if (!role) return false;
  return allowed.includes(role);
}

/**
 * Promote toward seller/admin without demoting accidentally.
 * BUYER → SELLER; never downgrade ADMIN.
 */
export function elevateRole(current: AppRole, next: AppRole): AppRole {
  const rank: Record<AppRole, number> = { BUYER: 1, SELLER: 2, ADMIN: 3 };
  return rank[next] > rank[current] ? next : current;
}

export function defaultRedirectForRole(role: AppRole): string {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "SELLER") return "/dashboard/projects";
  return "/dashboard/purchases";
}
