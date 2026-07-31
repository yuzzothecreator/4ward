import { auth, currentUser } from "@clerk/nextjs/server";
import { issueAdminSessionToken, requireRateLimit, requireSameOrigin, jsonSecure, clientIp } from "@/lib/security";
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
import { normalizeRole } from "@/lib/rbac";
import { ensureAppUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Issue a signed admin session token after verifying the caller is an admin.
 *
 * Allow when email is allowlisted AND any of:
 * - Clerk session with publicMetadata.role = ADMIN
 * - Clerk session as ADMIN_EMAIL (bootstrap owner)
 * - DB user.role = ADMIN
 * - Valid ADMIN_PASSWORD_HASH password
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
        { error: err instanceof Error ? err.message : "Admin secrets misconfigured" },
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

    if (!isAdminEmail(email)) {
      await writeAdminAudit({
        action: "admin.session.denied",
        entity: "User",
        metadata: {
          email,
          reason: "not_allowlisted",
          expected: getAdminEmail(),
        },
        ipAddress: clientIp(req),
      });
      return jsonSecure(
        {
          error: "Not an allowlisted admin account",
          hint: `Sign in as ${getAdminEmail()} (ADMIN_EMAIL), or add this email to ADMIN_EMAILS and restart the server.`,
          signedInAs: email,
          allowlistedAs: getAdminEmail(),
        },
        { status: 403 }
      );
    }

    let allowed = false;
    let userId: string | undefined;
    let via: "clerk" | "password" | "db" = "db";

    // Prefer live Clerk session for the same allowlisted email
    if (clerkEnabled) {
      const { userId: clerkUserId } = await auth();
      const clerkUser = clerkUserId ? await currentUser() : null;
      const clerkEmail =
        clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
        clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
        "";
      const clerkRole = normalizeRole(clerkUser?.publicMetadata?.role, "BUYER");

      if (clerkUserId && clerkEmail === email && isAdminEmail(clerkEmail)) {
        const isOwner = email === getAdminEmail();
        if (clerkRole === "ADMIN" || isOwner) {
          allowed = true;
          via = "clerk";
        }
      }
    }

    // DB role ADMIN on allowlisted email
    if (!allowed) {
      const db = await pingDatabase();
      if (db.ok) {
        const prisma = await getPrisma();
        const row = await prisma.user.findUnique({ where: { email } });
        userId = row?.id;
        if (row?.role === "ADMIN") {
          allowed = true;
          via = "db";
        }
      }
    }

    // Password gate for allowlisted admin
    if (!allowed && hasAdminPasswordConfigured()) {
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
        return jsonSecure({ error: "Invalid admin credentials" }, { status: 401 });
      }
      allowed = true;
      via = "password";
    }

    // Local-dev fallback without password hash
    if (!allowed && !isProductionRuntime() && !hasAdminPasswordConfigured()) {
      if (email === getAdminEmail()) {
        allowed = true;
        via = "db";
      }
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
          error: "Not an admin account",
          hint:
            "Set Clerk publicMetadata.role to ADMIN, or use the bootstrap admin password.",
        },
        { status: 403 }
      );
    }

    // Ensure a single ADMIN row exists for this email
    const synced = await ensureAppUser({
      email,
      name: String(body.name || "Admin"),
      username: typeof body.username === "string" ? body.username : undefined,
      university:
        typeof body.university === "string" ? body.university : undefined,
      role: "ADMIN",
      minRole: "ADMIN",
    });
    userId = synced.user?.id || userId;

    await ensureAdminUsersSynced({
      actorEmail: email,
      sessionUser: {
        name: String(body.name || "Admin"),
        email,
        username: body.username,
        university: body.university,
      },
    });

    const session = issueAdminSessionToken(email);

    await writeAdminAudit({
      userId,
      action: "admin.session.issued",
      entity: "User",
      metadata: { email, expiresAt: session.expiresAt, via },
      ipAddress: clientIp(req),
    });

    return jsonSecure({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      expiresIn: session.expiresIn,
      via,
    });
  } catch (err) {
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Could not create admin session",
      },
      { status: 400 }
    );
  }
}
