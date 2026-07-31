import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/users";
import {
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
  jsonSecure,
} from "@/lib/security";
import { messageSchema } from "@/lib/validations";
import { staffVisibleUsersWhere } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

async function resolveMe(req: Request, bodyEmail?: string) {
  if (clerkEnabled) {
    const { userId } = await auth();
    if (!userId) return { error: "Sign in to use messages", status: 401 as const };
    const clerkUser = await currentUser();
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
      "";
    if (!email) return { error: "Sign in to use messages", status: 401 as const };
    const name =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser?.fullName ||
      email.split("@")[0] ||
      "User";
    const synced = await ensureAppUser({
      email,
      name,
      clerkId: userId,
      avatar: clerkUser?.imageUrl || null,
    });
    if (!synced.user) {
      return {
        error: synced.error || "Could not sync account",
        status: (synced.demo ? 503 : 500) as 503 | 500,
      };
    }
    return { user: synced.user };
  }

  const url = new URL(req.url);
  const email = (
    bodyEmail ||
    url.searchParams.get("email") ||
    ""
  )
    .trim()
    .toLowerCase();
  if (!email) return { error: "email is required", status: 400 as const };
  const synced = await ensureAppUser({ email, name: email.split("@")[0] });
  if (!synced.user) {
    return {
      error: synced.error || "Could not sync account",
      status: (synced.demo ? 503 : 500) as 503 | 500,
    };
  }
  return { user: synced.user };
}

/**
 * GET /api/messages
 * - threads list (default)
 * - ?peerId= → conversation + mark read
 * - ?q= → search people to message
 */
export async function GET(req: Request) {
  const limited = requireRateLimit(req, "messages-get", 60, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { threads: [], messages: [], demo: true, error: db.error },
      { status: 503 }
    );
  }

  const me = await resolveMe(req);
  if ("error" in me) {
    return jsonSecure({ error: me.error }, { status: me.status });
  }

  const prisma = await getPrisma();
  const url = new URL(req.url);
  const peerId = url.searchParams.get("peerId");
  const q = url.searchParams.get("q")?.trim() || "";

  try {
    // Search users to start a chat
    if (q.length >= 2) {
      // Admin/Customer desk cannot find Super Admin; marketplace users can.
      const hideSuper =
        me.user.role === "ADMIN" || me.user.role === "SUPPORT"
          ? staffVisibleUsersWhere(me.user.role)
          : {};

      const people = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: me.user.id } },
            hideSuper,
            {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 12,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          university: true,
        },
      });
      return jsonSecure({
        people: people.map((p) => ({
          ...p,
          avatar:
            p.avatar ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(p.username)}`,
        })),
      });
    }

    // Full conversation with one peer
    if (peerId) {
      const peer = await prisma.user.findUnique({
        where: { id: peerId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
        },
      });
      if (!peer) {
        return jsonSecure({ error: "User not found" }, { status: 404 });
      }

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: me.user.id, receiverId: peerId },
            { senderId: peerId, receiverId: me.user.id },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          project: { select: { id: true, title: true, slug: true } },
        },
      });

      // Mark inbound as read
      await prisma.message.updateMany({
        where: {
          senderId: peerId,
          receiverId: me.user.id,
          read: false,
        },
        data: { read: true },
      });

      return jsonSecure({
        me: {
          id: me.user.id,
          name: me.user.name,
          email: me.user.email,
        },
        peer: {
          ...peer,
          avatar:
            peer.avatar ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(peer.username)}`,
        },
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          read: m.read,
          mine: m.senderId === me.user.id,
          project: m.project
            ? {
                id: m.project.id,
                title: m.project.title,
                slug: m.project.slug,
              }
            : null,
        })),
      });
    }

    // Thread list
    const all = await prisma.message.findMany({
      where: {
        OR: [{ senderId: me.user.id }, { receiverId: me.user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 400,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
        project: { select: { id: true, title: true, slug: true } },
      },
    });

    const threadMap = new Map<
      string,
      {
        peer: {
          id: string;
          name: string;
          username: string;
          email: string;
          avatar: string;
        };
        lastMessage: string;
        lastAt: string;
        unreadCount: number;
        projectTitle: string | null;
      }
    >();

    for (const m of all) {
      const peer = m.senderId === me.user.id ? m.receiver : m.sender;
      if (threadMap.has(peer.id)) continue;
      const unreadCount = all.filter(
        (x) =>
          x.senderId === peer.id &&
          x.receiverId === me.user.id &&
          !x.read
      ).length;
      threadMap.set(peer.id, {
        peer: {
          id: peer.id,
          name: peer.name,
          username: peer.username,
          email: peer.email,
          avatar:
            peer.avatar ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(peer.username)}`,
        },
        lastMessage: m.content,
        lastAt: m.createdAt.toISOString(),
        unreadCount,
        projectTitle: m.project?.title || null,
      });
    }

    const threads = [...threadMap.values()].sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );

    const unreadTotal = threads.reduce((n, t) => n + t.unreadCount, 0);

    return jsonSecure({
      me: {
        id: me.user.id,
        name: me.user.name,
        email: me.user.email,
      },
      threads,
      unreadTotal,
    });
  } catch (err) {
    console.error("[messages.get]", err);
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Failed to load messages",
        threads: [],
      },
      { status: 500 }
    );
  }
}

/** POST — send a message */
export async function POST(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "messages-post", 40, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: db.error || "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const me = await resolveMe(req, body.email);
    if ("error" in me) {
      return jsonSecure({ error: me.error }, { status: me.status });
    }

    const parsed = messageSchema.safeParse({
      receiverId: body.receiverId,
      projectId: body.projectId || undefined,
      content: sanitizeText(String(body.content || ""), 2000),
    });
    if (!parsed.success) {
      return jsonSecure(
        { error: "Invalid message", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.receiverId === me.user.id) {
      return jsonSecure({ error: "Cannot message yourself" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const receiver = await prisma.user.findUnique({
      where: { id: parsed.data.receiverId },
    });
    if (!receiver) {
      return jsonSecure({ error: "Recipient not found" }, { status: 404 });
    }

    if (parsed.data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
      });
      if (!project) {
        return jsonSecure({ error: "Project not found" }, { status: 404 });
      }
    }

    const msg = await prisma.message.create({
      data: {
        senderId: me.user.id,
        receiverId: parsed.data.receiverId,
        content: parsed.data.content,
        projectId: parsed.data.projectId || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: parsed.data.receiverId,
        title: `Message from ${me.user.name}`,
        message: parsed.data.content.slice(0, 140),
        link: "/dashboard/messages",
      },
    });

    return jsonSecure({
      success: true,
      message: {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        read: msg.read,
        mine: true,
      },
    });
  } catch (err) {
    console.error("[messages.post]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}

/** PATCH — mark thread as read */
export async function PATCH(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "messages-patch", 60, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const me = await resolveMe(req, body.email);
    if ("error" in me) {
      return jsonSecure({ error: me.error }, { status: me.status });
    }
    const peerId = String(body.peerId || "");
    if (!peerId) {
      return jsonSecure({ error: "peerId required" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const result = await prisma.message.updateMany({
      where: {
        senderId: peerId,
        receiverId: me.user.id,
        read: false,
      },
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
