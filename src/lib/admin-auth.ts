import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  type AppRole,
  type Permission,
  type StaffRole,
  hasPermission,
  isStaffRole,
  normalizeRole,
} from "@/lib/rbac";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import {
  clientIp,
  requireRateLimit,
  requireSameOrigin,
  verifyAdminSessionToken,
  jsonSecure,
} from "@/lib/security";
import {
  assertAdminSecretsConfigured,
  getAdminEmail,
  isAdminEmail,
  isProductionRuntime,
} from "@/lib/admin-config";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export type AdminGate =
  | {
      ok: true;
      role: StaffRole;
      demo: boolean;
      actorEmail: string;
      actorUserId?: string;
      ip: string;
    }
  | { ok: false; response: NextResponse };

function tokenFrom(req: Request) {
  return (
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization") ||
    ""
  );
}

async function resolveDbStaff(
  email: string
): Promise<{ role: StaffRole; userId?: string } | null> {
  const db = await pingDatabase();
  if (!db.ok) return null;
  try {
    const prisma = await getPrisma();
    const row = await prisma.user.findUnique({ where: { email } });
    if (!row || !isStaffRole(row.role)) return null;
    return { role: row.role as StaffRole, userId: row.id };
  } catch {
    return null;
  }
}

function ownerStaffRole(email: string): StaffRole | null {
  if (email === getAdminEmail() || isAdminEmail(email)) return "SUPER_ADMIN";
  return null;
}

/**
 * Staff gate (SUPPORT | ADMIN | SUPER_ADMIN):
 * - Rate limit + same-origin on mutations
 * - Clerk session and/or signed staff session token
 * - Optional permission check
 */
export async function requireStaffActor(
  req: Request,
  opts?: { mutate?: boolean; permission?: Permission }
): Promise<AdminGate> {
  try {
    assertAdminSecretsConfigured();
  } catch (err) {
    return {
      ok: false,
      response: jsonSecure(
        {
          error:
            err instanceof Error ? err.message : "Admin secrets misconfigured",
        },
        { status: 503 }
      ),
    };
  }

  const ip = clientIp(req);
  const limited = requireRateLimit(
    req,
    "admin",
    opts?.mutate ? 30 : 60,
    60_000
  );
  if (limited) return { ok: false, response: limited };

  if (opts?.mutate) {
    const originBlock = requireSameOrigin(req);
    if (originBlock) return { ok: false, response: originBlock };
  }

  let actorEmail = "";
  let actorRole: StaffRole | null = null;
  let actorUserId: string | undefined;
  let demo = false;

  // 1) Clerk session
  if (clerkEnabled) {
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          "";
        const normalizedEmail = email.toLowerCase();
        const metaRole = normalizeRole(user?.publicMetadata?.role, "BUYER");

        if (normalizedEmail) {
          const owner = ownerStaffRole(normalizedEmail);
          if (owner) {
            actorEmail = normalizedEmail;
            actorRole = owner;
          } else if (isStaffRole(metaRole)) {
            actorEmail = normalizedEmail;
            actorRole = metaRole;
          } else {
            const dbStaff = await resolveDbStaff(normalizedEmail);
            if (dbStaff) {
              actorEmail = normalizedEmail;
              actorRole = dbStaff.role;
              actorUserId = dbStaff.userId;
            }
          }
        }
      }
    } catch {
      /* fall through */
    }
  }

  // 2) Signed staff session token
  if (!actorRole) {
    const verified = verifyAdminSessionToken(tokenFrom(req));
    if (verified.ok && verified.email) {
      const email = verified.email;
      const owner = ownerStaffRole(email);
      if (owner) {
        actorEmail = email;
        actorRole = owner;
        demo = !isProductionRuntime();
        const dbStaff = await resolveDbStaff(email);
        actorUserId = dbStaff?.userId;
      } else {
        const dbStaff = await resolveDbStaff(email);
        if (dbStaff) {
          actorEmail = email;
          actorRole = dbStaff.role;
          actorUserId = dbStaff.userId;
          demo = !isProductionRuntime();
        }
      }
    }
  }

  if (!actorRole || !actorEmail) {
    return {
      ok: false,
      response: jsonSecure(
        {
          error: "Unauthorized",
          hint: `Sign in as staff (${getAdminEmail()} or an assigned Admin / Support account).`,
        },
        { status: 401 }
      ),
    };
  }

  const needed = opts?.permission;
  if (needed && !hasPermission(actorRole, needed)) {
    return {
      ok: false,
      response: jsonSecure(
        {
          error: "Forbidden",
          hint: `Requires ${needed}. Your role: ${actorRole}.`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    role: actorRole,
    demo,
    actorEmail,
    actorUserId,
    ip,
  };
}

/** Admin console gate — requires admin:access (ADMIN + SUPER_ADMIN). */
export async function requireAdminActor(
  req: Request,
  opts?: { mutate?: boolean; permission?: Permission }
): Promise<AdminGate> {
  return requireStaffActor(req, {
    mutate: opts?.mutate,
    permission: opts?.permission ?? "admin:access",
  });
}

/** Persist security-relevant admin actions. */
export async function writeAdminAudit(opts: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const db = await pingDatabase();
    if (!db.ok) return;
    const prisma = await getPrisma();
    await prisma.auditLog.create({
      data: {
        userId: opts.userId || null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        metadata: (opts.metadata || undefined) as object | undefined,
        ipAddress: opts.ipAddress,
      },
    });
  } catch (err) {
    console.warn("[audit.write.failed]", err);
  }
}

/** Ensure bootstrap SUPER_ADMIN exists. Never escalate arbitrary session roles. */
export async function ensureAdminUsersSynced(opts: {
  actorEmail: string;
  sessionUser?: {
    name: string;
    email: string;
    username?: string;
    university?: string;
  } | null;
}) {
  const db = await pingDatabase();
  if (!db.ok) return { synced: false as const, error: db.error };

  const prisma = await getPrisma();
  const ownerEmail = getAdminEmail();

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      role: "SUPER_ADMIN",
      isApproved: true,
      name: "4ward Super Admin",
    },
    create: {
      clerkId: `admin_${ownerEmail}`,
      name: "4ward Super Admin",
      email: ownerEmail,
      username: "superadmin",
      role: "SUPER_ADMIN",
      university: "4ward",
      isApproved: true,
    },
  });

  if (opts.sessionUser?.email) {
    const email = opts.sessionUser.email.trim().toLowerCase();
    const usernameBase = (
      opts.sessionUser.username ||
      email.split("@")[0]?.replace(/[^a-z0-9_-]/gi, "") ||
      "user"
    ).slice(0, 20);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          name: opts.sessionUser.name || undefined,
          university: opts.sessionUser.university || undefined,
          ...(isAdminEmail(email)
            ? { role: "SUPER_ADMIN" as AppRole, isApproved: true }
            : {}),
        },
      });
    } else {
      let username = usernameBase;
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) username = `${usernameBase}${Date.now().toString(36).slice(-4)}`;

      await prisma.user.create({
        data: {
          clerkId: `local_${email}`,
          name: opts.sessionUser.name || email.split("@")[0] || "User",
          email,
          username,
          role: isAdminEmail(email) ? "SUPER_ADMIN" : "BUYER",
          university:
            opts.sessionUser.university || "University of Dar es Salaam",
          isApproved: isAdminEmail(email),
        },
      });
    }
  }

  return { synced: true as const };
}
