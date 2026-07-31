import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureAppUser } from "@/lib/users";
import { type AppRole } from "@/lib/rbac";
import {
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
} from "@/lib/security";

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
      if (metaRole === "BUYER" || metaRole === "SELLER" || metaRole === "ADMIN") {
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

    const intent =
      body.intent === "SELLER" || body.intent === "BUYER" ? body.intent : undefined;

    const result = await ensureAppUser({
      email,
      name: name || undefined,
      clerkId,
      avatar,
      role,
      minRole: intent,
      university: sanitizeText(body.university || "", 120) || undefined,
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

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        username: result.user.username,
        role: result.user.role,
        clerkId: result.user.clerkId,
        avatar: result.user.avatar,
        university: result.user.university,
        isApproved: result.user.isApproved,
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
