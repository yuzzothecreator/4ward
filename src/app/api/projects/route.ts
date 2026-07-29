import { NextResponse } from "next/server";
import { projectSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { assertApiRole } from "@/lib/auth";

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
      where: { status: { in: ["PUBLISHED", "APPROVED", "PENDING_REVIEW", "DRAFT"] } },
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
          },
        },
      },
    });
    return NextResponse.json({ projects, count: projects.length, demo: false });
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
    const gate = await assertApiRole(["SELLER", "ADMIN", "BUYER"]);
    if (!gate.ok) return gate.response;

    const ip = req.headers.get("x-forwarded-for") || "anon";
    const limited = rateLimit(`projects:${ip}`, 20, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const status = body.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    const slugBase = slugify(parsed.data.title);
    const payload = {
      title: parsed.data.title,
      slug: slugBase,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription || null,
      category: parsed.data.category,
      price: parsed.data.pricingType === "FREE" ? 0 : parsed.data.price,
      pricingType: parsed.data.pricingType === "FREE" ? "FREE" : "PAID",
      license: parsed.data.license,
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

    const prisma = await getPrisma();

    // Ensure a seller user exists (demo clerk id until Clerk is wired)
    const demoClerkId = body.clerkId || `demo_${parsed.data.title.slice(0, 12)}`;
    const email =
      body.sellerEmail ||
      `seller_${Date.now()}@4ward.local`;
    const username =
      body.sellerUsername ||
      `seller_${Date.now().toString(36)}`;

    const seller = await prisma.user.upsert({
      where: { email },
      update: { role: "SELLER" },
      create: {
        clerkId: `${demoClerkId}_${Date.now()}`,
        name: body.sellerName || "Student Creator",
        email,
        username,
        role: "SELLER",
        university: body.university || "University of Dar es Salaam",
        isApproved: true,
      },
    });

    let slug = slugBase;
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const project = await prisma.project.create({
      data: {
        ...payload,
        slug,
        sellerId: seller.id,
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
      demo: false,
    });

    return NextResponse.json({ success: true, project, demo: false }, { status: 201 });
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
