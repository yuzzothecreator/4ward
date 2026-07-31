import { getPrisma } from "@/lib/prisma";
import { normalizeUniversity } from "@/lib/university-exclusivity";

const MAX_SELLER_NOTIFICATIONS = 80;

/**
 * Alert developers/sellers that a buyer posted a project request.
 * Prefers same-university sellers, then fills with other creators.
 */
export async function notifySellersOfBuyerRequest(input: {
  requestId: string;
  buyerId: string;
  buyerName: string;
  title: string;
  university?: string | null;
  category?: string;
}) {
  const prisma = await getPrisma();
  const uni = normalizeUniversity(input.university);

  const sellerWhere = {
    id: { not: input.buyerId },
    OR: [
      { role: { in: ["SELLER", "ADMIN", "SUPER_ADMIN"] as const } },
      { isApproved: true },
      { projects: { some: { status: "PUBLISHED" as const } } },
    ],
  };

  const sameCampus = uni
    ? await prisma.user.findMany({
        where: {
          AND: [sellerWhere, { university: { equals: input.university!, mode: "insensitive" } }],
        },
        take: 40,
        select: { id: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const sameIds = new Set(sameCampus.map((u) => u.id));
  const remaining = MAX_SELLER_NOTIFICATIONS - sameCampus.length;

  const others =
    remaining > 0
      ? await prisma.user.findMany({
          where: {
            AND: [
              sellerWhere,
              sameIds.size > 0 ? { id: { notIn: [...sameIds, input.buyerId] } } : {},
            ],
          },
          take: remaining,
          select: { id: true },
          orderBy: { updatedAt: "desc" },
        })
      : [];

  const recipients = [...sameCampus, ...others];
  if (recipients.length === 0) return { notified: 0 };

  const link = `/requests/${input.requestId}`;
  const title = "New buyer request";
  const message = `${input.buyerName} needs “${input.title.slice(0, 80)}”${
    input.university ? ` · ${input.university}` : ""
  }. Send an offer.`;

  await prisma.notification.createMany({
    data: recipients.map((u) => ({
      userId: u.id,
      title,
      message: message.slice(0, 280),
      link,
      read: false,
    })),
  });

  return { notified: recipients.length };
}
