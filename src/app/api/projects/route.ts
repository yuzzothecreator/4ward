import { NextResponse } from "next/server";
import { projectSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { assertApiRole, resolveApiActor } from "@/lib/auth";
import { ensureAppUser } from "@/lib/users";
import { requireSameOrigin } from "@/lib/security";
import { isProductionRuntime } from "@/lib/production";
import { canonicalizeInstitution } from "@/lib/tanzania-institutions";

export async function GET() {
  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json({
      projects: [],
      count: 0,
      demo: true,
      warning: db.error,
    });
  }

  try {
    const prisma = await getPrisma();
    const projects = await prisma.project.findMany({
      where: { status: { in: ["PUBLISHED", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            university: true,
            badges: { select: { badge: true } },
          },
        },
      },
    });
    return NextResponse.json({
      projects: projects.map((p) => ({
        ...p,
        seller: {
          ...p.seller,
          badges: p.seller.badges.map((b) => b.badge),
        },
      })),
      count: projects.length,
      demo: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        projects: [],
        count: 0,
        demo: true,
        error: err instanceof Error ? err.message : "Query failed",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const originBlock = requireSameOrigin(req);
    if (originBlock) return originBlock;

    const gate = await assertApiRole([
      "SELLER",
      "ADMIN",
      "SUPER_ADMIN",
      "BUYER",
    ]);
    if (!gate.ok) return gate.response;

    const ip = req.headers.get("x-forwarded-for") || "anon";
    const limited = rateLimit(`projects:${ip}`, 20, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const actor = await resolveApiActor({
      fallbackEmail:
        typeof body.sellerEmail === "string" ? body.sellerEmail : undefined,
      fallbackName:
        typeof body.sellerName === "string" ? body.sellerName : undefined,
      fallbackClerkId:
        typeof body.clerkId === "string" ? body.clerkId : undefined,
    });
    if (!actor.ok) return actor.response;

    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const status = body.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    const wantsMarket =
      parsed.data.listingType === "MARKET" ||
      parsed.data.license === "COMMERCIAL";
    const slugBase = slugify(parsed.data.title);
    const payload = {
      title: parsed.data.title,
      slug: slugBase,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription || null,
      category: parsed.data.category,
      price: parsed.data.pricingType === "FREE" ? 0 : parsed.data.price,
      pricingType: parsed.data.pricingType === "FREE" ? "FREE" : "PAID",
      listingType: parsed.data.listingType === "MARKET" ? "MARKET" : "CAMPUS",
      license: parsed.data.license,
      setupGuide: parsed.data.setupGuide,
      documentation: parsed.data.documentationUrl || null,
      technologyStack: parsed.data.technologyStack,
      demoUrl: parsed.data.demoUrl || null,
      githubRepo: parsed.data.githubRepo || null,
      sourceFile:
        typeof body.sourceFile === "string" && body.sourceFile
          ? body.sourceFile
          : `projects/${slugBase}/source.zip`,
      status: status as "DRAFT" | "PUBLISHED",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    };

    const db = await pingDatabase();
    if (!db.ok) {
      if (isProductionRuntime()) {
        return NextResponse.json(
          { error: "Database unavailable" },
          { status: 503 }
        );
      }
      // Local demo: never allow Market without a real DB badge check
      if (wantsMarket) {
        return NextResponse.json(
          {
            error:
              "Only verified sellers can list Market / commercial products. Request verification first.",
            code: "VERIFICATION_REQUIRED",
          },
          { status: 403 }
        );
      }
      const project = {
        id: `proj_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json(
        { success: true, project, demo: true, warning: db.error },
        { status: 201 }
      );
    }

    const universityRaw =
      typeof body.university === "string" ? body.university.trim() : "";
    const university =
      canonicalizeInstitution(universityRaw) || universityRaw || undefined;

    const sellerResult = await ensureAppUser({
      email: actor.email,
      name: actor.name,
      clerkId: actor.clerkId,
      avatar: actor.imageUrl,
      university,
      minRole: "SELLER",
      role: "SELLER",
    });
    if (!sellerResult.user) {
      return NextResponse.json(
        { error: sellerResult.error || "Could not resolve seller" },
        { status: 500 }
      );
    }

    const prisma = await getPrisma();
    const sellerGate = await prisma.user.findUnique({
      where: { id: sellerResult.user.id },
      include: { badges: { select: { badge: true } } },
    });
    if (!sellerGate) {
      return NextResponse.json(
        { error: "Seller profile missing" },
        { status: 500 }
      );
    }

    if (wantsMarket) {
      const verified = sellerGate.badges.some(
        (b) => b.badge === "VERIFIED_CREATOR"
      );
      if (!verified) {
        return NextResponse.json(
          {
            error:
              "Only verified sellers can list Market / commercial products. Request verification first.",
            code: "VERIFICATION_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    if (status === "PUBLISHED") {
      const { isSellerProfileReady } = await import("@/lib/seller-profile");
      if (
        !isSellerProfileReady({
          bio: sellerGate.bio,
          supportNote: sellerGate.supportNote,
        })
      ) {
        return NextResponse.json(
          {
            error:
              "Complete your seller profile (bio + buyer support note) before publishing.",
            code: "SELLER_PROFILE_INCOMPLETE",
          },
          { status: 403 }
        );
      }
    }

    let slug = slugBase;
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const project = await prisma.project.create({
      data: {
        ...payload,
        slug,
        sellerId: sellerGate.id,
        coverImage:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
        ],
      },
    });

    console.info("[audit] project.create", {
      id: project.id,
      title: project.title,
      status: project.status,
      sellerId: sellerGate.id,
      demo: false,
    });

    return NextResponse.json(
      { success: true, project, demo: false },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
