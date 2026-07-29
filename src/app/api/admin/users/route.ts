import { getPrisma, pingDatabase } from "@/lib/prisma";
import {
  ensureAdminUsersSynced,
  requireAdminActor,
  writeAdminAudit,
} from "@/lib/admin-auth";
import { isAppRole, type AppRole } from "@/lib/rbac";
import { jsonSecure, sanitizeText } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Requires signed admin session (x-admin-token) or Clerk ADMIN.
 */
export async function GET(req: Request) {
  const gate = await requireAdminActor(req);
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { users: [], demo: true, error: db.error || "Database unavailable" },
      { status: 503 }
    );
  }

  try {
    const url = new URL(req.url);
    await ensureAdminUsersSynced({
      actorEmail: gate.actorEmail,
      sessionUser: {
        name: sanitizeText(url.searchParams.get("sessionName") || "Admin", 80),
        email: gate.actorEmail,
        username: sanitizeText(url.searchParams.get("sessionUsername") || "", 40) || undefined,
        university:
          sanitizeText(url.searchParams.get("sessionUniversity") || "", 120) ||
          undefined,
      },
    });

    const prisma = await getPrisma();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        university: true,
        isApproved: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { projects: true, purchases: true, reviews: true },
        },
      },
    });

    return jsonSecure({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role as AppRole,
        university: u.university || "—",
        isApproved: u.isApproved,
        bio: u.bio,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        projectsCount: u._count.projects,
        purchasesCount: u._count.purchases,
        reviewsCount: u._count.reviews,
        isYou: u.email.toLowerCase() === gate.actorEmail.toLowerCase(),
      })),
      total: users.length,
      demo: gate.demo,
      actorEmail: gate.actorEmail,
    });
  } catch (err) {
    console.error("[admin.users.list]", err);
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Failed to list users",
        users: [],
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdminActor(req, { mutate: true });
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) {
      return jsonSecure({ error: "userId is required" }, { status: 400 });
    }

    const db = await pingDatabase();
    if (!db.ok) {
      return jsonSecure(
        { error: "Database unavailable — cannot persist user changes" },
        { status: 503 }
      );
    }

    const data: {
      role?: AppRole;
      isApproved?: boolean;
      name?: string;
      university?: string | null;
      bio?: string | null;
    } = {};

    if (body.role !== undefined) {
      if (!isAppRole(body.role)) {
        return jsonSecure({ error: "Invalid role" }, { status: 400 });
      }
      data.role = body.role;
    }
    if (typeof body.isApproved === "boolean") data.isApproved = body.isApproved;
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = sanitizeText(body.name, 80);
    }
    if (typeof body.university === "string") {
      data.university = sanitizeText(body.university, 120) || null;
    }
    if (typeof body.bio === "string") {
      data.bio = sanitizeText(body.bio, 500) || null;
    }

    if (Object.keys(data).length === 0) {
      return jsonSecure({ error: "No changes provided" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return jsonSecure({ error: "User not found" }, { status: 404 });
    }

    if (
      existing.email.toLowerCase() === gate.actorEmail.toLowerCase() &&
      data.role &&
      data.role !== "ADMIN"
    ) {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: userId } },
      });
      if (otherAdmins === 0) {
        return jsonSecure(
          { error: "Cannot demote the only admin account" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        university: true,
        isApproved: true,
        bio: true,
        updatedAt: true,
      },
    });

    await writeAdminAudit({
      userId: gate.actorUserId,
      action: "admin.user.update",
      entity: "User",
      entityId: userId,
      metadata: { changes: data, targetEmail: existing.email },
      ipAddress: gate.ip,
    });

    return jsonSecure({
      success: true,
      user: {
        ...updated,
        role: updated.role as AppRole,
        university: updated.university || "—",
        updatedAt: updated.updatedAt.toISOString(),
      },
      demo: gate.demo,
    });
  } catch (err) {
    console.error("[admin.users.patch]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const gate = await requireAdminActor(req, { mutate: true });
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const result = await ensureAdminUsersSynced({
      actorEmail: gate.actorEmail,
      sessionUser: body.user
        ? {
            name: sanitizeText(body.user.name || "Admin", 80),
            email: gate.actorEmail,
            username: sanitizeText(body.user.username || "", 40) || undefined,
            university: sanitizeText(body.user.university || "", 120) || undefined,
          }
        : { name: "Admin", email: gate.actorEmail },
    });

    if (!result.synced) {
      return jsonSecure(
        { error: result.error || "Database unavailable" },
        { status: 503 }
      );
    }

    await writeAdminAudit({
      userId: gate.actorUserId,
      action: "admin.user.sync",
      entity: "User",
      ipAddress: gate.ip,
    });

    return jsonSecure({ success: true, synced: true });
  } catch (err) {
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
