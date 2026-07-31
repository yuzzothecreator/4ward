import { getPrisma, pingDatabase } from "@/lib/prisma";

/** Campus presentation exclusivity window */
export const UNIVERSITY_EXCLUSIVITY_MONTHS = 4;

export type UniversityLockResult =
  | { allowed: true; reason?: "owner" | "no_prior" | "expired" | "no_university_on_holders" }
  | {
      allowed: false;
      code: "UNIVERSITY_LOCKED" | "UNIVERSITY_REQUIRED";
      message: string;
      lockedUntil?: string;
      holderName?: string;
      university?: string;
    };

/** Normalize campus names so "UDSM " and "udsm" match. */
export function normalizeUniversity(value: string | null | undefined): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function exclusivityWindowStart(from = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() - UNIVERSITY_EXCLUSIVITY_MONTHS);
  return d;
}

export function exclusivityExpiresAt(purchasedAt: Date): Date {
  const d = new Date(purchasedAt);
  d.setMonth(d.getMonth() + UNIVERSITY_EXCLUSIVITY_MONTHS);
  return d;
}

/**
 * One completed purchase of a project locks it for other students
 * at the same university for {@link UNIVERSITY_EXCLUSIVITY_MONTHS} months.
 * The original buyer can still access / re-fulfill.
 */
export async function checkUniversityExclusivity(input: {
  projectId: string;
  buyerId: string;
  buyerUniversity: string | null | undefined;
}): Promise<UniversityLockResult> {
  const uni = normalizeUniversity(input.buyerUniversity);
  if (!uni) {
    return {
      allowed: false,
      code: "UNIVERSITY_REQUIRED",
      message:
        "Add your university in your profile before purchasing. We keep one campus buyer per project for 4 months so presentations don’t collide.",
    };
  }

  const db = await pingDatabase();
  if (!db.ok) {
    // Offline demo — cannot enforce; allow with no lock data
    return { allowed: true, reason: "no_prior" };
  }

  const prisma = await getPrisma();
  const since = exclusivityWindowStart();

  const recent = await prisma.purchase.findMany({
    where: {
      projectId: input.projectId,
      paymentStatus: "COMPLETED",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, university: true } },
    },
  });

  const sameCampus = recent.filter(
    (p) => normalizeUniversity(p.buyer.university) === uni
  );

  if (sameCampus.length === 0) {
    return { allowed: true, reason: "no_prior" };
  }

  const own = sameCampus.find((p) => p.buyerId === input.buyerId);
  if (own) {
    return { allowed: true, reason: "owner" };
  }

  const holder = sameCampus[0];
  const lockedUntil = exclusivityExpiresAt(holder.createdAt);

  return {
    allowed: false,
    code: "UNIVERSITY_LOCKED",
    university: input.buyerUniversity?.trim() || uni,
    holderName: holder.buyer.name,
    lockedUntil: lockedUntil.toISOString(),
    message: `A student from ${input.buyerUniversity?.trim() || "your university"} already bought this project. It’s reserved for campus presentations until ${lockedUntil.toLocaleDateString()}. After that, other students at the same university can purchase it again.`,
  };
}

/** Resolve project id from id or slug, then run exclusivity check for a buyer email. */
export async function checkUniversityExclusivityForEmail(input: {
  email: string;
  projectId?: string;
  slug?: string;
  /** If profile university is missing, sync from client before checking */
  university?: string;
}): Promise<UniversityLockResult & { projectId?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    return {
      allowed: false,
      code: "UNIVERSITY_REQUIRED",
      message: "Sign in to check campus availability.",
    };
  }

  const db = await pingDatabase();
  if (!db.ok) {
    return { allowed: true, reason: "no_prior" };
  }

  const prisma = await getPrisma();
  let buyer = await prisma.user.findUnique({ where: { email } });

  const incomingUni = input.university?.trim();
  if (buyer && incomingUni && !normalizeUniversity(buyer.university)) {
    buyer = await prisma.user.update({
      where: { id: buyer.id },
      data: { university: incomingUni },
    });
  }

  if (!buyer) {
    if (!incomingUni) {
      return {
        allowed: false,
        code: "UNIVERSITY_REQUIRED",
        message:
          "Add your university in your profile before purchasing. We keep one campus buyer per project for 4 months so presentations don’t collide.",
      };
    }
    const { ensureAppUser } = await import("@/lib/users");
    const synced = await ensureAppUser({
      email,
      name: email.split("@")[0],
      university: incomingUni,
      minRole: "BUYER",
    });
    buyer = synced.user;
  }

  if (!buyer) {
    return {
      allowed: false,
      code: "UNIVERSITY_REQUIRED",
      message:
        "Complete your profile (including university) before purchasing.",
    };
  }

  if (!normalizeUniversity(buyer.university)) {
    return {
      allowed: false,
      code: "UNIVERSITY_REQUIRED",
      message:
        "Add your university in your profile before purchasing. We keep one campus buyer per project for 4 months so presentations don’t collide.",
    };
  }

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        input.projectId ? { id: input.projectId } : undefined,
        input.slug ? { slug: input.slug } : undefined,
      ].filter(Boolean) as { id?: string; slug?: string }[],
    },
    select: { id: true },
  });

  // Catalog/demo listings may not exist in DB yet — allow until fulfill creates them
  if (!project) {
    return { allowed: true, reason: "no_prior", projectId: undefined };
  }

  const result = await checkUniversityExclusivity({
    projectId: project.id,
    buyerId: buyer.id,
    buyerUniversity: buyer.university,
  });

  return { ...result, projectId: project.id };
}
