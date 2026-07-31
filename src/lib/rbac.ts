/**
 * Marketplace RBAC
 * Marketplace: BUYER | SELLER
 * Staff: SUPPORT | ADMIN | SUPER_ADMIN
 */

export type AppRole =
  | "BUYER"
  | "SELLER"
  | "SUPPORT"
  | "ADMIN"
  | "SUPER_ADMIN";

export type StaffRole = "SUPPORT" | "ADMIN" | "SUPER_ADMIN";

export type Permission =
  | "marketplace:browse"
  | "marketplace:purchase"
  | "listings:create"
  | "listings:manage_own"
  | "dashboard:buyer"
  | "dashboard:seller"
  | "support:access"
  | "support:users:view"
  | "support:orders:view"
  | "admin:access"
  | "admin:users"
  | "admin:approvals"
  | "admin:roles"
  | "admin:billing";

export const APP_ROLES: AppRole[] = [
  "BUYER",
  "SELLER",
  "SUPPORT",
  "ADMIN",
  "SUPER_ADMIN",
];

export const STAFF_ROLES: StaffRole[] = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];

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

const SUPPORT_PERMISSIONS: Permission[] = [
  ...BUYER_PERMISSIONS,
  "support:access",
  "support:users:view",
  "support:orders:view",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...SELLER_PERMISSIONS,
  ...SUPPORT_PERMISSIONS,
  "admin:access",
  "admin:users",
  "admin:approvals",
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  "admin:roles",
  "admin:billing",
];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  BUYER: BUYER_PERMISSIONS,
  SELLER: SELLER_PERMISSIONS,
  SUPPORT: SUPPORT_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  SUPPORT: "Customer service",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export const ROLE_RANK: Record<AppRole, number> = {
  BUYER: 1,
  SELLER: 2,
  SUPPORT: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

/** Demo / bootstrap owner email — from ADMIN_EMAIL env. */
export const DEMO_ADMIN_EMAIL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()) ||
  (typeof process !== "undefined" &&
    process.env.ADMIN_EMAIL?.trim().toLowerCase()) ||
  "admin@4ward.com";

export function isAppRole(value: unknown): value is AppRole {
  return (
    value === "BUYER" ||
    value === "SELLER" ||
    value === "SUPPORT" ||
    value === "ADMIN" ||
    value === "SUPER_ADMIN"
  );
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "SUPPORT" || value === "ADMIN" || value === "SUPER_ADMIN";
}

export function normalizeRole(
  value: unknown,
  fallback: AppRole = "BUYER"
): AppRole {
  return isAppRole(value) ? value : fallback;
}

export function roleFromEmail(email: string, preferred?: AppRole): AppRole {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_ADMIN_EMAIL) return "SUPER_ADMIN";
  const publicList = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (publicList.includes(normalized)) return "SUPER_ADMIN";
  return preferred || "BUYER";
}

export function hasPermission(
  role: AppRole | null | undefined,
  permission: Permission
) {
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
export function roleAllowed(
  role: AppRole | null | undefined,
  allowed: AppRole[]
) {
  if (!role) return false;
  return allowed.includes(role);
}

/**
 * Promote toward a higher role without demoting.
 * BUYER → SELLER → SUPPORT → ADMIN → SUPER_ADMIN
 */
export function elevateRole(current: AppRole, next: AppRole): AppRole {
  return ROLE_RANK[next] > ROLE_RANK[current] ? next : current;
}

export function defaultRedirectForRole(role: AppRole): string {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return "/dashboard/admin";
  if (role === "SUPPORT") return "/dashboard/support";
  return "/welcome";
}

/** Roles an actor may assign to someone else. */
export function assignableRolesFor(actor: AppRole | null | undefined): AppRole[] {
  if (actor === "SUPER_ADMIN") return [...APP_ROLES];
  if (actor === "ADMIN") return ["BUYER", "SELLER"];
  return [];
}

export function canAssignRole(
  actor: AppRole | null | undefined,
  targetRole: AppRole
): boolean {
  return assignableRolesFor(actor).includes(targetRole);
}
