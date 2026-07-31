import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureAppUser } from "@/lib/users";
import { type AppRole } from "@/lib/rbac";
import {
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
} from "@/lib/security";
import { canonicalizeInstitution } from "@/lib/tanzania-institutions";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * POST /api/users/sync
 * Links Clerk auth identity → single Supabase/Postgres User row (by email + clerkId).
 * Prevents duplicate people (Clerk user vs local_ DB user).
 */
export async function POST(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;

  const limited = requireRateLimit(req, "users-sync", 30, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));

    let email = "";
    let name = "";
    let clerkId: string | null = null;
    let avatar: string | null = null;
    let role: AppRole | undefined;

    if (clerkEnabled) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const clerkUser = await currentUser();
      email =
        clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
        clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
        "";
      name =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
        clerkUser?.fullName ||
        clerkUser?.username ||
        "";
      clerkId = userId;
      avatar = clerkUser?.imageUrl || null;
      const metaRole = clerkUser?.publicMetadata?.role;
      if (
        metaRole === "BUYER" ||
        metaRole === "SELLER" ||
        metaRole === "SUPPORT" ||
        metaRole === "ADMIN" ||
        metaRole === "SUPER_ADMIN"
      ) {
        role = metaRole;
      }
    } else {
      email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      name = sanitizeText(body.name || "", 80);
      clerkId =
        typeof body.clerkId === "string" && body.clerkId.trim()
          ? body.clerkId.trim()
          : null;
    }

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Allowlisted bootstrap owner always syncs as SUPER_ADMIN
    const { isAdminEmail } = await import("@/lib/admin-config");
    if (isAdminEmail(email)) {
      role = "SUPER_ADMIN";
    }

    const intent =
      body.intent === "SELLER" || body.intent === "BUYER" ? body.intent : undefined;

    const result = await ensureAppUser({
      email,
      name: name || undefined,
      clerkId,
      avatar,
      role,
      minRole: intent,
      university: (() => {
        const raw = sanitizeText(body.university || "", 120);
        return canonicalizeInstitution(raw) || raw || undefined;
      })(),
      username: sanitizeText(body.username || "", 30) || undefined,
    });

    if (!result.user) {
      return NextResponse.json(
        {
          error: result.error || "Could not sync user",
          demo: result.demo,
        },
        { status: result.demo ? 503 : 500 }
      );
    }

    // Seller-facing profile fields (bio, support, links)
    let profileUser = result.user;
    const bio =
      typeof body.bio === "string" ? sanitizeText(body.bio, 500) : undefined;
    const supportNote =
      typeof body.supportNote === "string"
        ? sanitizeText(body.supportNote, 1000)
        : undefined;
    const whatsapp =
      typeof body.whatsapp === "string"
        ? sanitizeText(body.whatsapp, 40)
        : undefined;
    const website =
      typeof body.website === "string" ? sanitizeText(body.website, 200) : undefined;
    const githubUrl =
      typeof body.githubUrl === "string"
        ? sanitizeText(body.githubUrl, 200)
        : undefined;
    const skills = Array.isArray(body.skills)
      ? body.skills
          .filter((s: unknown): s is string => typeof s === "string")
          .map((s: string) => sanitizeText(s, 40))
          .filter(Boolean)
          .slice(0, 20)
      : undefined;

    const wantsProfilePatch =
      bio !== undefined ||
      supportNote !== undefined ||
      whatsapp !== undefined ||
      website !== undefined ||
      githubUrl !== undefined ||
      skills !== undefined;

    if (wantsProfilePatch && !result.demo) {
      try {
        const { getPrisma, pingDatabase } = await import("@/lib/prisma");
        const db = await pingDatabase();
        if (db.ok) {
          const prisma = await getPrisma();
          profileUser = await prisma.user.update({
            where: { id: result.user.id },
            data: {
              ...(bio !== undefined ? { bio } : {}),
              ...(supportNote !== undefined ? { supportNote } : {}),
              ...(whatsapp !== undefined ? { whatsapp } : {}),
              ...(website !== undefined ? { website: website || null } : {}),
              ...(githubUrl !== undefined ? { githubUrl: githubUrl || null } : {}),
              ...(skills !== undefined ? { skills } : {}),
            },
          });
        }
      } catch {
        /* keep ensureAppUser row */
      }
    }

    let verified = false;
    try {
      const { getPrisma, pingDatabase } = await import("@/lib/prisma");
      const db = await pingDatabase();
      if (db.ok) {
        const prisma = await getPrisma();
        const badge = await prisma.userBadge.findUnique({
          where: {
            userId_badge: {
              userId: profileUser.id,
              badge: "VERIFIED_CREATOR",
            },
          },
        });
        verified = Boolean(badge);
      }
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profileUser.id,
        email: profileUser.email,
        name: profileUser.name,
        username: profileUser.username,
        role: profileUser.role,
        clerkId: profileUser.clerkId,
        avatar: profileUser.avatar,
        university: profileUser.university,
        isApproved: profileUser.isApproved,
        bio: profileUser.bio,
        supportNote: (profileUser as { supportNote?: string | null }).supportNote,
        whatsapp: (profileUser as { whatsapp?: string | null }).whatsapp,
        website: profileUser.website,
        githubUrl: profileUser.githubUrl,
        skills: profileUser.skills,
        verified,
      },
      demo: result.demo,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
