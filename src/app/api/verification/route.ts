import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/users";
import {
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
} from "@/lib/security";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

async function resolveRequester(body: { email?: string; name?: string }) {
  if (clerkEnabled) {
    const { userId } = await auth();
    if (!userId) return { error: "Sign in to request verification", status: 401 as const };
    const clerkUser = await currentUser();
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
      "";
    if (!email) return { error: "Sign in to request verification", status: 401 as const };
    const name =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser?.fullName ||
      email.split("@")[0] ||
      "Seller";
    return { email, name, clerkId: userId };
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? sanitizeText(body.name, 80) : "";
  if (!email) return { error: "Sign in to request verification", status: 401 as const };
  return { email, name: name || email.split("@")[0] || "Seller", clerkId: `local_${email}` };
}

/**
 * GET /api/verification?email=
 * Returns verification + blue-tick status for a seller.
 */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json({
      verified: false,
      request: null,
      demo: true,
      warning: db.error,
    });
  }

  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        badges: true,
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        verified: false,
        request: null,
        demo: false,
      });
    }

    const verified = user.badges.some((b) => b.badge === "VERIFIED_CREATOR");
    const latest = user.verificationRequests[0] || null;

    return NextResponse.json({
      verified,
      isApproved: user.isApproved,
      request: latest
        ? {
            id: latest.id,
            status: latest.status,
            message: latest.message,
            evidenceUrl: latest.evidenceUrl,
            adminNote: latest.adminNote,
            createdAt: latest.createdAt.toISOString(),
            reviewedAt: latest.reviewedAt?.toISOString() || null,
          }
        : null,
      demo: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        verified: false,
        request: null,
        error: err instanceof Error ? err.message : "Failed to load verification",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verification — seller requests blue-tick verification.
 */
export async function POST(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;

  const limited = requireRateLimit(req, "verification", 8, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json(
      { error: "Database unavailable — try again later." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const who = await resolveRequester(body);
    if ("error" in who) {
      return NextResponse.json({ error: who.error }, { status: who.status });
    }

    const message = sanitizeText(body.message, 800);
    if (message.length < 20) {
      return NextResponse.json(
        {
          error:
            "Tell us why you should be verified (at least 20 characters).",
        },
        { status: 400 }
      );
    }

    const evidenceRaw =
      typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
    const evidenceUrl = evidenceRaw
      ? sanitizeText(evidenceRaw, 300)
      : null;
    if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) {
      return NextResponse.json(
        { error: "Evidence must be a valid http(s) URL" },
        { status: 400 }
      );
    }

    const userResult = await ensureAppUser({
      email: who.email,
      name: who.name,
      clerkId: who.clerkId,
      minRole: "SELLER",
    });
    const user = userResult.user;
    if (!user) {
      return NextResponse.json(
        { error: userResult.error || "Could not resolve user" },
        { status: 503 }
      );
    }

    const prisma = await getPrisma();
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
    });

    if (badges.some((b) => b.badge === "VERIFIED_CREATOR")) {
      return NextResponse.json(
        { error: "You already have a verified blue tick." },
        { status: 409 }
      );
    }

    const pending = await prisma.verificationRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (pending) {
      return NextResponse.json(
        {
          error: "You already have a pending verification request.",
          request: {
            id: pending.id,
            status: pending.status,
            createdAt: pending.createdAt.toISOString(),
          },
        },
        { status: 409 }
      );
    }

    const request = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        message,
        evidenceUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "verification.request",
        entity: "VerificationRequest",
        entityId: request.id,
        metadata: { email: who.email },
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: request.id,
        status: request.status,
        message: request.message,
        evidenceUrl: request.evidenceUrl,
        createdAt: request.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to submit request",
      },
      { status: 500 }
    );
  }
}
