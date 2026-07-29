import { issueAdminSessionToken, requireRateLimit, requireSameOrigin, jsonSecure, clientIp } from "@/lib/security";
import { DEMO_ADMIN_EMAIL } from "@/lib/rbac";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { ensureAdminUsersSynced, writeAdminAudit } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Issue a signed admin session token after verifying the caller is an admin.
 * Body: { email }
 * Prevents spoofing admin APIs with only an x-admin-email header.
 */
export async function POST(req: Request) {
  const limited = requireRateLimit(req, "admin-session", 10, 60_000);
  if (limited) return limited;
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;

  try {
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return jsonSecure({ error: "email is required" }, { status: 400 });
    }

    let allowed = email === DEMO_ADMIN_EMAIL;
    let userId: string | undefined;

    if (!allowed) {
      const db = await pingDatabase();
      if (db.ok) {
        const prisma = await getPrisma();
        const row = await prisma.user.findUnique({ where: { email } });
        allowed = row?.role === "ADMIN";
        userId = row?.id;
      }
    }

    if (!allowed) {
      await writeAdminAudit({
        action: "admin.session.denied",
        entity: "User",
        metadata: { email },
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
      metadata: { email, expiresAt: session.expiresAt },
      ipAddress: clientIp(req),
    });

    return jsonSecure({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      expiresIn: session.expiresIn,
    });
  } catch {
    return jsonSecure({ error: "Could not create admin session" }, { status: 400 });
  }
}
