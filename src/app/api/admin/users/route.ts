import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import {
  ensureAdminUsersSynced,
  requireAdminActor,
} from "@/lib/admin-auth";
import { isAppRole, type AppRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function actorFrom(req: Request, body?: { actorEmail?: string }) {
  const url = new URL(req.url);
  return (
    body?.actorEmail ||
    req.headers.get("x-admin-email") ||
    url.searchParams.get("actorEmail") ||
    ""
  );
}

/**
 * GET /api/admin/users?actorEmail=
 * Lists real users from Postgres with project/purchase counts.
 */
export async function GET(req: Request) {
  const actorEmail = actorFrom(req);
  const gate = await requireAdminActor(actorEmail);
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json(
      {
        users: [],
        demo: true,
        error: db.error || "Database unavailable",
      },
      { status: 503 }
    );
  }

  try {
    const sessionName = new URL(req.url).searchParams.get("sessionName");
    const sessionUniversity = new URL(req.url).searchParams.get("sessionUniversity");
    const sessionUsername = new URL(req.url).searchParams.get("sessionUsername");
    const sessionRole = new URL(req.url).searchParams.get("sessionRole");

    await ensureAdminUsersSynced({
      actorEmail: gate.actorEmail,
      sessionUser: {
        name: sessionName || "Admin",
        email: gate.actorEmail,
        username: sessionUsername || undefined,
        university: sessionUniversity || undefined,
        role: isAppRole(sessionRole) ? sessionRole : "ADMIN",
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
          select: {
            projects: true,
            purchases: true,
            reviews: true,
          },
        },
      },
    });

    return NextResponse.json({
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
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to list users",
        users: [],
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update role, approval, name, university, bio for a real user.
 * Body: { actorEmail, userId, role?, isApproved?, name?, university?, bio? }
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const actorEmail = actorFrom(req, body);
    const gate = await requireAdminActor(actorEmail);
    if (!gate.ok) return gate.response;

    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const db = await pingDatabase();
    if (!db.ok) {
      return NextResponse.json(
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
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = body.role;
    }
    if (typeof body.isApproved === "boolean") data.isApproved = body.isApproved;
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.university === "string") {
      data.university = body.university.trim() || null;
    }
    if (typeof body.bio === "string") {
      data.bio = body.bio.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent locking yourself out of admin accidentally without another admin
    if (
      existing.email.toLowerCase() === gate.actorEmail.toLowerCase() &&
      data.role &&
      data.role !== "ADMIN"
    ) {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: userId } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
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

    console.info("[audit] admin.user.update", {
      by: gate.actorEmail,
      userId,
      changes: data,
    });

    return NextResponse.json({
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users — sync session user into DB (admin only).
 * Body: { actorEmail, user: { name, email, username?, university?, role? } }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const gate = await requireAdminActor(actorFrom(req, body));
    if (!gate.ok) return gate.response;

    const result = await ensureAdminUsersSynced({
      actorEmail: gate.actorEmail,
      sessionUser: body.user
        ? {
            name: String(body.user.name || ""),
            email: String(body.user.email || gate.actorEmail),
            username: body.user.username,
            university: body.user.university,
            role: isAppRole(body.user.role) ? body.user.role : undefined,
          }
        : { name: "Admin", email: gate.actorEmail, role: "ADMIN" },
    });

    if (!result.synced) {
      return NextResponse.json(
        { error: result.error || "Database unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, synced: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
