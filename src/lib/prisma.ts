/**
 * Prisma client — lazy init so the app boots in demo mode without a live DB.
 * Supabase direct hosts are often IPv6-only; use the pooler URL in DATABASE_URL.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");

  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL || "");
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Strip sslmode from URL so pg uses our ssl options (Supabase pooler chain)
  let poolUrl = connectionString;
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    poolUrl = u.toString();
  } catch {
    /* keep as-is */
  }

  const pool = new pg.default.Pool({
    connectionString: poolUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

/** Probe DB without throwing to callers that only need status */
export async function pingDatabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    const prisma = await getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Database unreachable",
    };
  }
}

/** @deprecated Prefer getPrisma() */
export const prisma = null as unknown as PrismaClient;
