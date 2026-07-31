import { randomBytes } from "crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { demoProjects } from "@/lib/demo-data";

/**
 * Resolve a project by id or slug; create from catalog if missing (demo listings).
 */
export async function ensureProjectByIdOrSlug(
  prisma: PrismaClient,
  params: { projectId?: string; slug?: string; title?: string; price?: number }
) {
  const or: Array<{ id: string } | { slug: string }> = [];
  if (params.projectId) or.push({ id: params.projectId });
  if (params.slug) or.push({ slug: params.slug });
  if (!or.length) return null;

  const includeSeller = {
    seller: {
      select: { id: true, name: true, username: true, avatar: true },
    },
  } as const;

  let project = await prisma.project.findFirst({
    where: { OR: or },
    include: includeSeller,
  });

  if (project) return project;

  const catalog = demoProjects.find(
    (p) =>
      (params.projectId && p.id === params.projectId) ||
      (params.slug && p.slug === params.slug)
  );
  if (!catalog && !params.slug) return null;

  const sellerEmail = catalog
    ? `${catalog.seller.username}@4ward.sellers`
    : "catalog@4ward.local";

  const seller = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: { role: "SELLER", isApproved: true },
    create: {
      clerkId: `seller_${sellerEmail}`,
      name: catalog?.seller.name || "4ward Catalog",
      email: sellerEmail,
      username:
        catalog?.seller.username ||
        `catalog_${randomBytes(3).toString("hex")}`,
      role: "SELLER",
      university: catalog?.seller.university || "University of Dar es Salaam",
      isApproved: true,
      avatar: catalog?.seller.avatar,
    },
  });

  const slug =
    catalog?.slug || params.slug || `project-${randomBytes(4).toString("hex")}`;

  try {
    project = await prisma.project.create({
      data: {
        title: catalog?.title || params.title || slug,
        slug,
        description: catalog?.description || params.title || slug,
        shortDescription:
          catalog?.shortDescription || (params.title || slug).slice(0, 140),
        category: (catalog?.category as
          | "WEB_APPLICATIONS"
          | "MOBILE_APPLICATIONS"
          | "ARTIFICIAL_INTELLIGENCE"
          | "CYBERSECURITY"
          | "IOT"
          | "BLOCKCHAIN"
          | "DATA_SCIENCE"
          | "DATABASE_SYSTEMS"
          | "UI_UX_DESIGNS") || "WEB_APPLICATIONS",
        price: catalog?.price ?? params.price ?? 0,
        pricingType: (catalog?.price ?? params.price ?? 0) === 0 ? "FREE" : "PAID",
        license: "SOURCE_CODE",
        status: "PUBLISHED",
        coverImage: catalog?.coverImage,
        images: catalog?.images || [],
        demoUrl: catalog?.demoUrl,
        githubRepo: catalog?.githubRepo,
        technologyStack: catalog?.technologyStack || [],
        sourceFile: `projects/${slug}/source.zip`,
        sellerId: seller.id,
        publishedAt: new Date(),
      },
      include: includeSeller,
    });
  } catch {
    project = await prisma.project.findUnique({
      where: { slug },
      include: includeSeller,
    });
  }

  return project;
}
