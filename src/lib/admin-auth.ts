import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { type AppRole, normalizeRole } from "@/lib/rbac";
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
      role: "ADMIN";
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

/**
 * Hardened admin gate:
 * - Rate limit
 * - Same-origin on mutations
 * - Clerk ADMIN role OR signed admin session token (not spoofable email alone)
 */
export async function requireAdminActor(
  req: Request,
  opts?: { mutate?: boolean }
): Promise<AdminGate> {
  try {
    assertAdminSecretsConfigured();
  } catch (err) {
    return {
      ok: false,
      response: jsonSecure(
        { error: err instanceof Error ? err.message : "Admin secrets misconfigured" },
        { status: 503 }
      ),
    };
  }

  const ip = clientIp(req);
  const limited = requireRateLimit(req, "admin", opts?.mutate ? 30 : 60, 60_000);
  if (limited) return { ok: false, response: limited };

  if (opts?.mutate) {
    const originBlock = requireSameOrigin(req);
    if (originBlock) return { ok: false, response: originBlock };
  }

  if (clerkEnabled) {
    const { userId } = await auth();
    if (!userId) {
      return {
        ok: false,
        response: jsonSecure({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    const user = await currentUser();
    const role = normalizeRole(user?.publicMetadata?.role, "BUYER");
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "";
    const normalizedEmail = email.toLowerCase();

    if (role !== "ADMIN" || !isAdminEmail(normalizedEmail)) {
      return {
        ok: false,
        response: jsonSecure({ error: "Admin access required" }, { status: 403 }),
      };
    }
    return {
      ok: true,
      role: "ADMIN",
      demo: false,
      actorEmail: normalizedEmail,
      actorUserId: undefined,
      ip,
    };
  }

  const verified = verifyAdminSessionToken(tokenFrom(req));
  if (!verified.ok || !verified.email) {
    return {
      ok: false,
      response: jsonSecure(
        {
          error: verified.error || "Admin session required",
          hint: "POST /api/admin/session after signing in as admin",
        },
        { status: 401 }
      ),
    };
  }

  const email = verified.email;

  if (!isAdminEmail(email)) {
    return {
      ok: false,
      response: jsonSecure({ error: "Admin access required" }, { status: 403 }),
    };
  }

  // Token + allowlist — also confirm DB role in production
  if (email === getAdminEmail() && !isProductionRuntime()) {
    const db = await pingDatabase();
    let actorUserId: string | undefined;
    if (db.ok) {
      try {
        const prisma = await getPrisma();
        const row = await prisma.user.findUnique({ where: { email } });
        actorUserId = row?.id;
      } catch {
        /* ignore */
      }
    }
    return {
      ok: true,
      role: "ADMIN",
      demo: true,
      actorEmail: email,
      actorUserId,
      ip,
    };
  }

  const db = await pingDatabase();
  if (!db.ok) {
    return {
      ok: false,
      response: jsonSecure({ error: "Database unavailable" }, { status: 503 }),
    };
  }

  try {
    const prisma = await getPrisma();
    const row = await prisma.user.findUnique({ where: { email } });
    if (row?.role === "ADMIN" && isAdminEmail(email)) {
      return {
        ok: true,
        role: "ADMIN",
        demo: false,
        actorEmail: email,
        actorUserId: row.id,
        ip,
      };
    }
  } catch {
    /* fall through */
  }

  return {
    ok: false,
    response: jsonSecure({ error: "Admin access required" }, { status: 403 }),
  };
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

/** Ensure demo admin exists. Never escalate arbitrary session roles from the client. */
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

  await prisma.user.upsert({
    where: { email: getAdminEmail() },
    update: { role: "ADMIN", isApproved: true, name: "4ward Admin" },
    create: {
      clerkId: `admin_${getAdminEmail()}`,
      name: "4ward Admin",
      email: getAdminEmail(),
      username: "admin",
      role: "ADMIN",
      university: "4ward",
      isApproved: true,
    },
  });

  if (opts.sessionUser?.email) {
    const email = opts.sessionUser.email.trim().toLowerCase();
    // Security: only allowlisted admin emails get ADMIN from sync.
    const usernameBase =
      (opts.sessionUser.username ||
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
            ? { role: "ADMIN" as AppRole, isApproved: true }
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
          role: isAdminEmail(email) ? "ADMIN" : "BUYER",
          university: opts.sessionUser.university || "University of Dar es Salaam",
          isApproved: isAdminEmail(email),
        },
      });
    }
  }

  return { synced: true as const };
}
