/**
 * Optional seed script — run after `prisma db push` with a live DATABASE_URL.
 * Usage: npx tsx prisma/seed.ts
 */
import "dotenv/config";
import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = await getPrisma();

  const seller = await prisma.user.upsert({
    where: { email: "amina@example.com" },
    update: {},
    create: {
      clerkId: "demo_clerk_amina",
      name: "Amina Okello",
      email: "amina@example.com",
      username: "aminaokello",
      role: "SELLER",
      university: "University of Nairobi",
      bio: "Full-stack developer & CS student.",
      skills: ["Next.js", "TypeScript", "Node.js"],
      isApproved: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amina",
    },
  });

  await prisma.project.upsert({
    where: { slug: "campusconnect-student-social-network" },
    update: {},
    create: {
      title: "CampusConnect — Student Social Network",
      slug: "campusconnect-student-social-network",
      description:
        "A full-stack social networking platform built for university students.",
      shortDescription: "Campus social network with real-time chat.",
      category: "WEB_APPLICATIONS",
      price: 49,
      pricingType: "PAID",
      license: "SOURCE_CODE",
      status: "PUBLISHED",
      coverImage:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
      images: [],
      technologyStack: ["Next.js", "TypeScript", "PostgreSQL"],
      sellerId: seller.id,
      publishedAt: new Date(),
    },
  });

  console.log("Seed complete:", seller.username);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
