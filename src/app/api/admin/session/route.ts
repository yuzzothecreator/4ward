import { auth, currentUser } from "@clerk/nextjs/server";
import {
  issueAdminSessionToken,
  requireRateLimit,
  requireSameOrigin,
  jsonSecure,
  clientIp,
} from "@/lib/security";
import {
  assertAdminSecretsConfigured,
  getAdminEmail,
  hasAdminPasswordConfigured,
  isAdminEmail,
  isProductionRuntime,
  verifyAdminPassword,
} from "@/lib/admin-config";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { ensureAdminUsersSynced, writeAdminAudit } from "@/lib/admin-auth";
import { isStaffRole, normalizeRole, type StaffRole } from "@/lib/rbac";
import { ensureAppUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Issue a signed staff session token (SUPPORT | ADMIN | SUPER_ADMIN).
 *
 * Allow when:
 * - Allowlisted SUPER_ADMIN email + Clerk / password / DB
 * - DB role is SUPPORT | ADMIN | SUPER_ADMIN (assigned by Super Admin)
 * - Clerk publicMetadata staff role matching email
 */
export async function POST(req: Request) {
  const limited = requireRateLimit(req, "admin-session", 8, 60_000);
  if (limited) return limited;
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;

  try {
    try {
      assertAdminSecretsConfigured();
    } catch (err) {
      return jsonSecure(
        {
          error:
            err instanceof Error ? err.message : "Admin secrets misconfigured",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) {
      return jsonSecure({ error: "email is required" }, { status: 400 });
    }

    let allowed = false;
    let staffRole: StaffRole = "ADMIN";
    let userId: string | undefined;
    let via: "clerk" | "password" | "db" = "db";

    // Prefer live Clerk session for the same email
    if (clerkEnabled) {
      const { userId: clerkUserId } = await auth();
      const clerkUser = clerkUserId ? await currentUser() : null;
      const clerkEmail =
        clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
        clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
        "";
      const clerkRole = normalizeRole(clerkUser?.publicMetadata?.role, "BUYER");

      if (clerkUserId && clerkEmail === email) {
        if (isAdminEmail(email)) {
          allowed = true;
          staffRole = "SUPER_ADMIN";
          via = "clerk";
        } else if (isStaffRole(clerkRole)) {
          allowed = true;
          staffRole = clerkRole;
          via = "clerk";
        }
      }
    }

    // DB staff role (SUPPORT / ADMIN / SUPER_ADMIN)
    if (!allowed) {
      const db = await pingDatabase();
      if (db.ok) {
        const prisma = await getPrisma();
        const row = await prisma.user.findUnique({ where: { email } });
        userId = row?.id;
        if (row && isStaffRole(row.role)) {
          allowed = true;
          staffRole = row.role as StaffRole;
          via = "db";
        }
      }
    }

    // Password gate — allowlisted SUPER_ADMIN only
    if (!allowed && isAdminEmail(email) && hasAdminPasswordConfigured()) {
      if (!password) {
        return jsonSecure(
          {
            error: "Admin password required",
            code: "PASSWORD_REQUIRED",
            hint: "Enter the password from npm run admin:bootstrap",
          },
          { status: 401 }
        );
      }
      if (!verifyAdminPassword(password)) {
        await writeAdminAudit({
          action: "admin.session.denied",
          entity: "User",
          metadata: { email, reason: "bad_password" },
          ipAddress: clientIp(req),
        });
        return jsonSecure(
          { error: "Invalid admin credentials" },
          { status: 401 }
        );
      }
      allowed = true;
      staffRole = "SUPER_ADMIN";
      via = "password";
    }

    // Local-dev fallback without password hash
    if (
      !allowed &&
      !isProductionRuntime() &&
      !hasAdminPasswordConfigured() &&
      email === getAdminEmail()
    ) {
      allowed = true;
      staffRole = "SUPER_ADMIN";
      via = "db";
    }

    if (!allowed) {
      await writeAdminAudit({
        action: "admin.session.denied",
        entity: "User",
        metadata: { email, reason: "unauthorized" },
        ipAddress: clientIp(req),
      });
      return jsonSecure(
        {
          error: "Not a staff account",
          hint: `Ask a Super Admin to assign SUPPORT/ADMIN, or sign in as ${getAdminEmail()}.`,
          signedInAs: email,
        },
        { status: 403 }
      );
    }

    const synced = await ensureAppUser({
      email,
      name: String(body.name || "Staff"),
      username: typeof body.username === "string" ? body.username : undefined,
      university:
        typeof body.university === "string" ? body.university : undefined,
      role: staffRole,
      minRole: staffRole,
    });
    userId = synced.user?.id || userId;

    if (isAdminEmail(email)) {
      await ensureAdminUsersSynced({
        actorEmail: email,
        sessionUser: {
          name: String(body.name || "Super Admin"),
          email,
          username: body.username,
          university: body.university,
        },
      });
    }

    const session = issueAdminSessionToken(email);

    await writeAdminAudit({
      userId,
      action: "admin.session.issued",
      entity: "User",
      metadata: { email, role: staffRole, expiresAt: session.expiresAt, via },
      ipAddress: clientIp(req),
    });

    return jsonSecure({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      expiresIn: session.expiresIn,
      role: staffRole,
      via,
    });
  } catch (err) {
    return jsonSecure(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not create admin session",
      },
      { status: 400 }
    );
  }
}
