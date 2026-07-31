import { randomBytes } from "crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import {
  elevateRole,
  normalizeRole,
  type AppRole,
} from "@/lib/rbac";
import { isAdminEmail } from "@/lib/admin-config";

export type EnsureAppUserInput = {
  email: string;
  name?: string;
  /** Real Clerk user id when available — never invent a second person */
  clerkId?: string | null;
  username?: string;
  university?: string;
  avatar?: string | null;
  role?: AppRole;
  /** Promote to at least this role without downgrading */
  minRole?: AppRole;
};

function slugifyUsername(email: string, fallback = "user") {
  const base = (email.split("@")[0] || fallback)
    .replace(/[^a-z0-9_-]/gi, "")
    .toLowerCase()
    .slice(0, 20);
  return base || fallback;
}

function isPlaceholderClerkId(clerkId: string) {
  return (
    clerkId.startsWith("local_") ||
    clerkId.startsWith("demo_") ||
    clerkId.startsWith("seller_") ||
    clerkId.startsWith("admin_")
  );
}

/**
 * One identity for Clerk + Supabase Postgres.
 * Upserts by email (canonical), attaches real clerkId, never creates a second row
 * for the same person.
 */
export async function ensureAppUser(input: EnsureAppUserInput) {
  const db = await pingDatabase();
  if (!db.ok) {
    return { user: null as null, demo: true as const, error: db.error };
  }

  const prisma = await getPrisma();
  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { user: null as null, demo: false as const, error: "email required" };
  }

  const name =
    input.name?.trim() ||
    email.split("@")[0] ||
    "User";
  const preferredClerkId = input.clerkId?.trim() || "";
  const fallbackClerkId = preferredClerkId || `local_${email}`;

  let role: AppRole = isAdminEmail(email)
    ? "SUPER_ADMIN"
    : normalizeRole(input.role, "BUYER");
  if (input.minRole) {
    role = elevateRole(role, input.minRole);
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });

  if (existingByEmail) {
    const nextClerkId =
      preferredClerkId &&
      (isPlaceholderClerkId(existingByEmail.clerkId) ||
        existingByEmail.clerkId === preferredClerkId)
        ? preferredClerkId
        : existingByEmail.clerkId;

    // If another row already owns this clerkId, keep email row's clerkId
    let clerkIdToSet = nextClerkId;
    if (preferredClerkId && preferredClerkId !== existingByEmail.clerkId) {
      const clash = await prisma.user.findUnique({
        where: { clerkId: preferredClerkId },
      });
      if (clash && clash.id !== existingByEmail.id) {
        clerkIdToSet = existingByEmail.clerkId;
      }
    }

    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        name: input.name?.trim() || undefined,
        clerkId: clerkIdToSet,
        avatar: input.avatar || undefined,
        university: input.university?.trim() || undefined,
        role: elevateRole(existingByEmail.role as AppRole, role),
        ...(isAdminEmail(email)
          ? { role: "SUPER_ADMIN" as AppRole, isApproved: true }
          : {}),
      },
    });

    return { user: updated, demo: false as const };
  }

  if (preferredClerkId) {
    const existingByClerk = await prisma.user.findUnique({
      where: { clerkId: preferredClerkId },
    });
    if (existingByClerk) {
      const updated = await prisma.user.update({
        where: { id: existingByClerk.id },
        data: {
          email,
          name: input.name?.trim() || undefined,
          avatar: input.avatar || undefined,
          university: input.university?.trim() || undefined,
          role: elevateRole(existingByClerk.role as AppRole, role),
        },
      });
      return { user: updated, demo: false as const };
    }
  }

  const usernameBase =
    input.username?.replace(/[^a-z0-9_-]/gi, "").toLowerCase().slice(0, 24) ||
    slugifyUsername(email);
  let username = usernameBase;
  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    username = `${usernameBase}_${randomBytes(2).toString("hex")}`;
  }

  try {
    const created = await prisma.user.create({
      data: {
        clerkId: fallbackClerkId,
        email,
        name,
        username,
        role,
        university: input.university?.trim() || "UDSM",
        avatar: input.avatar || null,
        isApproved: isAdminEmail(email),
      },
    });
    return { user: created, demo: false as const };
  } catch {
    // Race: email/clerkId created concurrently — re-read by email
    const again = await prisma.user.findUnique({ where: { email } });
    if (again) return { user: again, demo: false as const };
    throw new Error("Could not create user");
  }
}

/** Resolve app user for an email without creating (optional clerk attach). */
export async function findAppUserByEmail(
  prisma: PrismaClient,
  email: string
) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}
