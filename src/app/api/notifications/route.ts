import { getPrisma, pingDatabase } from "@/lib/prisma";
import { resolveRequestUser } from "@/lib/session-user";
import {
  requireRateLimit,
  requireSameOrigin,
  jsonSecure,
} from "@/lib/security";

export const dynamic = "force-dynamic";

/** GET /api/notifications?email= — list recent notifications */
export async function GET(req: Request) {
  const limited = requireRateLimit(req, "notifications-get", 60, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ notifications: [], unread: 0, demo: true }, { status: 503 });
  }

  const me = await resolveRequestUser(req, undefined, "view notifications");
  if ("error" in me) {
    return jsonSecure({ error: me.error }, { status: me.status });
  }

  try {
    const prisma = await getPrisma();
    const rows = await prisma.notification.findMany({
      where: { userId: me.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unread = rows.filter((n) => !n.read).length;

    return jsonSecure({
      notifications: rows.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
      unread,
    });
  } catch (err) {
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Failed to load notifications",
        notifications: [],
        unread: 0,
      },
      { status: 500 }
    );
  }
}

/** PATCH /api/notifications — mark one or all as read */
export async function PATCH(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "notifications-patch", 40, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const me = await resolveRequestUser(req, body.email, "update notifications");
    if ("error" in me) {
      return jsonSecure({ error: me.error }, { status: me.status });
    }

    const prisma = await getPrisma();
    const id = typeof body.id === "string" ? body.id : "";
    const markAll = body.markAll === true;

    if (markAll) {
      const result = await prisma.notification.updateMany({
        where: { userId: me.user.id, read: false },
        data: { read: true },
      });
      return jsonSecure({ success: true, marked: result.count });
    }

    if (!id) {
      return jsonSecure({ error: "id or markAll required" }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where: { id, userId: me.user.id },
      data: { read: true },
    });

    return jsonSecure({ success: true, marked: result.count });
  } catch (err) {
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
