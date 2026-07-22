/**
 * Prisma client — lazy init so the app boots in demo mode without a live DB.
 * Import `getPrisma()` only in server code that needs the database.
 */
import type { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new pg.default.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

/** @deprecated Prefer getPrisma() — kept for sync-style call sites after generate */
export const prisma = null as unknown as PrismaClient;
