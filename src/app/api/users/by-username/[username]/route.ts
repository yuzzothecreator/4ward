import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { getUserByUsername, getProjectsByUsername } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/by-username/[username]
 * Public seller profile + projects (DB first, demo fallback).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  const { username: raw } = await ctx.params;
  const username = decodeURIComponent(raw || "")
    .trim()
    .replace(/^@/, "");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const db = await pingDatabase();
  if (db.ok) {
    try {
      const prisma = await getPrisma();
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          university: true,
          skills: true,
          website: true,
          githubUrl: true,
          role: true,
          badges: { select: { badge: true } },
          projects: {
            where: { status: { in: ["PUBLISHED", "APPROVED"] } },
            orderBy: { createdAt: "desc" },
            take: 24,
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              shortDescription: true,
              category: true,
              price: true,
              pricingType: true,
              license: true,
              status: true,
              coverImage: true,
              images: true,
              demoUrl: true,
              githubRepo: true,
              technologyStack: true,
              views: true,
              downloads: true,
              createdAt: true,
            },
          },
          _count: { select: { purchases: true, projects: true } },
        },
      });

      if (user) {
        const badges = user.badges.map((b) => b.badge);
        const verified = badges.includes("VERIFIED_CREATOR");
        return NextResponse.json({
          demo: false,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar:
              user.avatar ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(user.username)}`,
            bio: user.bio || "",
            university: user.university || "—",
            skills: user.skills || [],
            website: user.website,
            githubUrl: user.githubUrl,
            badges,
            verified,
            role: user.role,
            totalSales: user._count.purchases,
            projectsCount: user._count.projects,
          },
          projects: user.projects.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description,
            shortDescription:
              p.shortDescription || p.description.slice(0, 140),
            category: p.category,
            price: p.price,
            pricingType: p.pricingType,
            license: p.license,
            status: p.status,
            coverImage: p.coverImage,
            images: p.images?.length ? p.images : [p.coverImage],
            demoUrl: p.demoUrl || "",
            githubRepo: p.githubRepo || undefined,
            technologyStack: p.technologyStack || [],
            views: p.views,
            downloads: p.downloads,
            rating: 0,
            reviewCount: 0,
            createdAt: p.createdAt.toISOString(),
            seller: {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar:
                user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(user.username)}`,
              university: user.university || "—",
              badges,
            },
          })),
        });
      }
    } catch (err) {
      console.error("[users.by-username]", err);
    }
  }

  const demoUser = getUserByUsername(username);
  if (!demoUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    demo: true,
    user: {
      ...demoUser,
      verified: demoUser.badges.includes("VERIFIED_CREATOR"),
    },
    projects: getProjectsByUsername(username),
  });
}
