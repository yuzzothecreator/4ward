import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DEMO_ADMIN_EMAIL, type AppRole, normalizeRole } from "@/lib/rbac";
import { getPrisma, pingDatabase } from "@/lib/prisma";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export type AdminGate =
  | { ok: true; role: "ADMIN"; demo: boolean; actorEmail: string }
  | { ok: false; response: NextResponse };

/**
 * Admin-only gate for API routes.
 * Clerk: publicMetadata.role === ADMIN
 * Demo: actor must be DEMO_ADMIN_EMAIL or a DB user with role ADMIN
 */
export async function requireAdminActor(actorEmail?: string | null): Promise<AdminGate> {
  if (clerkEnabled) {
    const { userId } = await auth();
    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    const user = await currentUser();
    const role = normalizeRole(user?.publicMetadata?.role, "BUYER");
    if (role !== "ADMIN") {
      return {
        ok: false,
        response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
      };
    }
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      actorEmail ||
      "";
    return { ok: true, role: "ADMIN", demo: false, actorEmail: email };
  }

  const email = (actorEmail || "").trim().toLowerCase();
  if (!email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin email required (sign in as admin)" },
        { status: 401 }
      ),
    };
  }

  if (email === DEMO_ADMIN_EMAIL) {
    return { ok: true, role: "ADMIN", demo: true, actorEmail: email };
  }

  const db = await pingDatabase();
  if (db.ok) {
    try {
      const prisma = await getPrisma();
      const row = await prisma.user.findUnique({ where: { email } });
      if (row?.role === "ADMIN") {
        return { ok: true, role: "ADMIN", demo: false, actorEmail: email };
      }
    } catch {
      /* fall through */
    }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
  };
}

/** Ensure demo admin + optional session user exist in Postgres. */
export async function ensureAdminUsersSynced(opts: {
  actorEmail: string;
  sessionUser?: {
    name: string;
    email: string;
    username?: string;
    university?: string;
    role?: AppRole;
  } | null;
}) {
  const db = await pingDatabase();
  if (!db.ok) return { synced: false as const, error: db.error };

  const prisma = await getPrisma();

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { role: "ADMIN", isApproved: true, name: "4ward Admin" },
    create: {
      clerkId: `admin_${DEMO_ADMIN_EMAIL}`,
      name: "4ward Admin",
      email: DEMO_ADMIN_EMAIL,
      username: "admin",
      role: "ADMIN",
      university: "4ward",
      isApproved: true,
    },
  });

  if (opts.sessionUser?.email) {
    const email = opts.sessionUser.email.trim().toLowerCase();
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
          role:
            email === DEMO_ADMIN_EMAIL
              ? "ADMIN"
              : opts.sessionUser.role || undefined,
          isApproved: true,
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
          role: email === DEMO_ADMIN_EMAIL ? "ADMIN" : opts.sessionUser.role || "BUYER",
          university: opts.sessionUser.university || "University of Dar es Salaam",
          isApproved: true,
        },
      });
    }
  }

  return { synced: true as const };
}
