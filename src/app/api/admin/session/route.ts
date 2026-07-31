import { NextResponse } from "next/server";
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

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Issue a signed admin session token after verifying the caller is an admin.
 *
 * Production rules:
 * - ADMIN_EMAIL / ADMIN_EMAILS allowlist required
 * - Strong ADMIN_SESSION_SECRET required
 * - Clerk mode: signed-in Clerk user with role ADMIN + allowlisted email
 * - Password mode: ADMIN_PASSWORD_HASH must match (no open passwords)
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
        metadata: { email, reason: "not_allowlisted" },
        ipAddress: clientIp(req),
      });
      return jsonSecure({ error: "Not an allowlisted admin account" }, { status: 403 });
    }

    let allowed = false;
    let userId: string | undefined;
    let via: "clerk" | "password" | "db" = "db";

    if (clerkEnabled) {
      const { userId: clerkUserId } = await auth();
      const clerkUser = clerkUserId ? await currentUser() : null;
      const clerkEmail =
        clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
        clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
        "";
      const clerkRole = normalizeRole(clerkUser?.publicMetadata?.role, "BUYER");

      if (
        clerkUserId &&
        clerkEmail === email &&
        clerkRole === "ADMIN" &&
        isAdminEmail(clerkEmail)
      ) {
        allowed = true;
        via = "clerk";
      }
    }

    // Password gate (required when hash is configured and Clerk didn't authorize)
    if (!allowed && hasAdminPasswordConfigured()) {
      if (!password) {
        return jsonSecure(
          { error: "Admin password required", code: "PASSWORD_REQUIRED" },
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

    // Dev fallback: DB role ADMIN on allowlisted email (never in production without password/Clerk)
    if (!allowed && !isProductionRuntime() && !hasAdminPasswordConfigured()) {
      const db = await pingDatabase();
      if (db.ok) {
        const prisma = await getPrisma();
        const row = await prisma.user.findUnique({ where: { email } });
        allowed = row?.role === "ADMIN";
        userId = row?.id;
        via = "db";
      }
      // Bootstrap email still works in local dev without hash (discouraged)
      if (!allowed && email === getAdminEmail()) allowed = true;
    }

    if (!allowed) {
      await writeAdminAudit({
        action: "admin.session.denied",
        entity: "User",
        metadata: { email, reason: "unauthorized" },
        ipAddress: clientIp(req),
      });
      return jsonSecure({ error: "Not an admin account" }, { status: 403 });
    }

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
  } catch {
    return jsonSecure({ error: "Could not create admin session" }, { status: 400 });
  }
}
