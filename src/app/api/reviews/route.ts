import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { reviewSchema } from "@/lib/validations";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { ensureProjectByIdOrSlug } from "@/lib/ensure-project";
import { ensureAppUser } from "@/lib/users";
import { demoProjects } from "@/lib/demo-data";
import {
  clientIp,
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
} from "@/lib/security";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function mapReview(r: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { name: string; username: string; avatar: string | null; email: string };
}) {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment || "",
    createdAt: r.createdAt.toISOString(),
    user: {
      name: r.user.name,
      username: r.user.username,
      avatar:
        r.user.avatar ||
        `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(r.user.email)}`,
    },
  };
}

/**
 * GET /api/reviews?projectId=&slug=
 * Returns real reviews only (no seed/fake comments).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId")?.trim() || undefined;
  const slug = url.searchParams.get("slug")?.trim() || undefined;
  const email = url.searchParams.get("email")?.trim().toLowerCase() || undefined;

  if (!projectId && !slug) {
    return NextResponse.json(
      { error: "projectId or slug is required" },
      { status: 400 }
    );
  }

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json({
      reviews: [],
      average: 0,
      count: 0,
      canReview: false,
      demo: true,
      warning: db.error,
    });
  }

  try {
    const prisma = await getPrisma();
    const or: Array<{ id: string } | { slug: string }> = [];
    if (projectId) or.push({ id: projectId });
    if (slug) or.push({ slug });

    const project = await prisma.project.findFirst({ where: { OR: or } });
    if (!project) {
      const catalog = demoProjects.find(
        (p) =>
          (projectId && p.id === projectId) || (slug && p.slug === slug)
      );
      const isFree = Boolean(
        catalog && (catalog.pricingType === "FREE" || catalog.price === 0)
      );
      return NextResponse.json({
        reviews: [],
        average: 0,
        count: 0,
        canReview: Boolean(email) && isFree,
        alreadyReviewed: false,
        projectId: null,
        demo: false,
      });
    }

    const rows = await prisma.review.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, username: true, avatar: true, email: true },
        },
      },
    });

    const count = rows.length;
    const average =
      count === 0
        ? 0
        : Math.round(
            (rows.reduce((sum, r) => sum + r.rating, 0) / count) * 10
          ) / 10;

    let canReview = false;
    let alreadyReviewed = false;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.id !== project.sellerId) {
        const existing = await prisma.review.findUnique({
          where: {
            userId_projectId: { userId: user.id, projectId: project.id },
          },
        });
        alreadyReviewed = Boolean(existing);

        if (project.pricingType === "FREE") {
          canReview = !alreadyReviewed;
        } else {
          const purchase = await prisma.purchase.findFirst({
            where: {
              buyerId: user.id,
              projectId: project.id,
              paymentStatus: "COMPLETED",
            },
          });
          canReview = Boolean(purchase) && !alreadyReviewed;
        }
      }
    }

    return NextResponse.json({
      reviews: rows.map(mapReview),
      average,
      count,
      canReview,
      alreadyReviewed,
      projectId: project.id,
      demo: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        reviews: [],
        average: 0,
        count: 0,
        error: err instanceof Error ? err.message : "Failed to load reviews",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews — persist a real user review (requires sign-in + purchase for paid).
 */
export async function POST(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;

  const limited = requireRateLimit(req, "reviews", 15, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json(
      { error: "Database unavailable — reviews cannot be saved right now." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();

    let email = "";
    let name = "";
    let clerkId: string | null = null;

    if (clerkEnabled) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
      }
      clerkId = userId;
      const clerkUser = await currentUser();
      email =
        clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
        clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
        "";
      name =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        clerkUser?.username ||
        "";
    } else {
      email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      name = typeof body.name === "string" ? sanitizeText(body.name, 80) : "";
      clerkId = email ? `local_${email}` : null;
    }

    if (!email) {
      return NextResponse.json(
        { error: "Sign in to leave a review" },
        { status: 401 }
      );
    }

    const parsed = reviewSchema.safeParse({
      projectId: body.projectId,
      rating: body.rating,
      comment: body.comment,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const comment = sanitizeText(parsed.data.comment, 1000);
    if (comment.length < 10) {
      return NextResponse.json(
        { error: "Comment must be at least 10 characters" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const slug =
      typeof body.slug === "string" ? body.slug.trim() : undefined;

    const project = await ensureProjectByIdOrSlug(prisma, {
      projectId: parsed.data.projectId,
      slug,
      title: typeof body.title === "string" ? body.title : undefined,
      price: typeof body.price === "number" ? body.price : undefined,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userResult = await ensureAppUser({
      email,
      name: name || undefined,
      clerkId,
      minRole: "BUYER",
    });
    const user = userResult.user;
    if (!user) {
      return NextResponse.json(
        { error: userResult.error || "Could not resolve user" },
        { status: 503 }
      );
    }

    if (user.id === project.sellerId) {
      return NextResponse.json(
        { error: "You cannot review your own project" },
        { status: 403 }
      );
    }

    if (project.pricingType !== "FREE") {
      const purchase = await prisma.purchase.findFirst({
        where: {
          buyerId: user.id,
          projectId: project.id,
          paymentStatus: "COMPLETED",
        },
      });
      if (!purchase) {
        return NextResponse.json(
          { error: "Purchase this project before leaving a review" },
          { status: 403 }
        );
      }
    }

    const review = await prisma.review.upsert({
      where: {
        userId_projectId: { userId: user.id, projectId: project.id },
      },
      update: {
        rating: parsed.data.rating,
        comment,
      },
      create: {
        userId: user.id,
        projectId: project.id,
        rating: parsed.data.rating,
        comment,
      },
      include: {
        user: {
          select: { name: true, username: true, avatar: true, email: true },
        },
      },
    });

    console.info("[audit] review.upsert", {
      id: review.id,
      projectId: project.id,
      userId: user.id,
      rating: review.rating,
      ip: clientIp(req),
    });

    return NextResponse.json({
      success: true,
      review: mapReview(review),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to save review",
      },
      { status: 500 }
    );
  }
}
