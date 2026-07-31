import { getPrisma, pingDatabase } from "@/lib/prisma";
import { resolveRequestUser } from "@/lib/session-user";
import {
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
  jsonSecure,
} from "@/lib/security";
import { projectOfferSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function mapOffer(o: {
  id: string;
  message: string;
  proposedPrice: number | null;
  deliveryDays: number | null;
  status: string;
  createdAt: Date;
  projectId: string | null;
  developer: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    university: string | null;
  };
  project: { id: string; title: string; slug: string; price: number } | null;
}) {
  return {
    id: o.id,
    message: o.message,
    proposedPrice: o.proposedPrice,
    deliveryDays: o.deliveryDays,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    projectId: o.projectId,
    project: o.project
      ? {
          id: o.project.id,
          title: o.project.title,
          slug: o.project.slug,
          price: o.project.price,
        }
      : null,
    developer: {
      id: o.developer.id,
      name: o.developer.name,
      username: o.developer.username,
      university: o.developer.university,
      avatar:
        o.developer.avatar ||
        `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(o.developer.username)}`,
    },
  };
}

/** GET /api/requests/[id] — request detail + offers */
export async function GET(req: Request, { params }: Params) {
  const limited = requireRateLimit(req, "request-detail", 60, 60_000);
  if (limited) return limited;

  const { id } = await params;
  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: db.error || "Database unavailable" }, { status: 503 });
  }

  try {
    const prisma = await getPrisma();
    const row = await prisma.projectRequest.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            university: true,
          },
        },
        offers: {
          orderBy: { createdAt: "desc" },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                university: true,
              },
            },
            project: {
              select: { id: true, title: true, slug: true, price: true },
            },
          },
        },
      },
    });

    if (!row) {
      return jsonSecure({ error: "Request not found" }, { status: 404 });
    }

    let viewerId: string | null = null;
const me = await resolveRequestUser(req, undefined, "view request");
    // Guests / missing demo email are fine — treat as anonymous viewer
    if (!("error" in me)) viewerId = me.user.id;

    return jsonSecure({
      request: {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        budgetMin: row.budgetMin,
        budgetMax: row.budgetMax,
        university: row.university,
        deadline: row.deadline?.toISOString() || null,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        offerCount: row.offers.length,
        isBuyer: viewerId === row.buyerId,
        buyer: {
          id: row.buyer.id,
          name: row.buyer.name,
          username: row.buyer.username,
          university: row.buyer.university,
          avatar:
            row.buyer.avatar ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(row.buyer.username)}`,
        },
      },
      offers: row.offers.map(mapOffer),
      viewerId,
    });
  } catch (err) {
    console.error("[requests.id.get]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Failed to load request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/requests/[id]
 * Buyer: status OPEN | FULFILLED | CLOSED
 * Or accept/decline an offer: { offerId, offerStatus: ACCEPTED|DECLINED }
 */
export async function PATCH(req: Request, { params }: Params) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "request-patch", 30, 60_000);
  if (limited) return limited;

  const { id } = await params;
  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const me = await resolveRequestUser(req, body.email, "update this request");
    if ("error" in me) {
      return jsonSecure({ error: me.error }, { status: me.status });
    }

    const prisma = await getPrisma();
    const row = await prisma.projectRequest.findUnique({ where: { id } });
    if (!row) {
      return jsonSecure({ error: "Request not found" }, { status: 404 });
    }
    if (row.buyerId !== me.user.id) {
      return jsonSecure({ error: "Only the buyer can update this request" }, { status: 403 });
    }

    // Accept / decline an offer
    if (body.offerId && body.offerStatus) {
      const offerStatus = String(body.offerStatus);
      if (offerStatus !== "ACCEPTED" && offerStatus !== "DECLINED") {
        return jsonSecure({ error: "Invalid offer status" }, { status: 400 });
      }

      const offer = await prisma.projectOffer.findFirst({
        where: { id: String(body.offerId), requestId: id },
        include: { developer: true },
      });
      if (!offer) {
        return jsonSecure({ error: "Offer not found" }, { status: 404 });
      }

      await prisma.projectOffer.update({
        where: { id: offer.id },
        data: { status: offerStatus },
      });

      if (offerStatus === "ACCEPTED") {
        await prisma.projectRequest.update({
          where: { id },
          data: { status: "FULFILLED" },
        });
        await prisma.projectOffer.updateMany({
          where: {
            requestId: id,
            id: { not: offer.id },
            status: "PENDING",
          },
          data: { status: "DECLINED" },
        });
        await prisma.notification.create({
          data: {
            userId: offer.developerId,
            title: "Your offer was accepted",
            message: `“${row.title}” — the buyer chose your proposal. Message them to deliver.`,
            link: `/dashboard/messages?peer=${encodeURIComponent(me.user.id)}`,
          },
        });
        await prisma.message.create({
          data: {
            senderId: me.user.id,
            receiverId: offer.developerId,
            content: `Hi! I accepted your offer on “${row.title}”. Let's continue here.`,
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: offer.developerId,
            title: "Offer update",
            message: `Your offer on “${row.title}” was declined.`,
            link: `/requests/${id}`,
          },
        });
      }

      return jsonSecure({ success: true, offerStatus });
    }

    const status = String(body.status || "");
    if (!["OPEN", "FULFILLED", "CLOSED"].includes(status)) {
      return jsonSecure({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.projectRequest.update({
      where: { id },
      data: { status: status as "OPEN" | "FULFILLED" | "CLOSED" },
    });

    return jsonSecure({ success: true, status: updated.status });
  } catch (err) {
    console.error("[requests.id.patch]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

/** POST /api/requests/[id] — developer submits an offer */
export async function POST(req: Request, { params }: Params) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "request-offer", 20, 60_000);
  if (limited) return limited;

  const { id } = await params;
  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const me = await resolveRequestUser(req, body.email, "send an offer");
    if ("error" in me) {
      return jsonSecure({ error: me.error }, { status: me.status });
    }

    const parsed = projectOfferSchema.safeParse({
      message: sanitizeText(String(body.message || ""), 2000),
      proposedPrice:
        body.proposedPrice === "" || body.proposedPrice == null
          ? null
          : body.proposedPrice,
      deliveryDays:
        body.deliveryDays === "" || body.deliveryDays == null
          ? null
          : body.deliveryDays,
      projectId: body.projectId || null,
    });
    if (!parsed.success) {
      return jsonSecure(
        { error: "Invalid offer", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const request = await prisma.projectRequest.findUnique({ where: { id } });
    if (!request) {
      return jsonSecure({ error: "Request not found" }, { status: 404 });
    }
    if (request.status !== "OPEN") {
      return jsonSecure(
        { error: "This request is no longer accepting offers" },
        { status: 400 }
      );
    }
    if (request.buyerId === me.user.id) {
      return jsonSecure(
        { error: "You cannot offer on your own request" },
        { status: 400 }
      );
    }

    if (parsed.data.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: parsed.data.projectId,
          sellerId: me.user.id,
          status: "PUBLISHED",
        },
      });
      if (!project) {
        return jsonSecure(
          { error: "Link a published project you own, or leave it empty" },
          { status: 400 }
        );
      }
    }

    const offer = await prisma.projectOffer.upsert({
      where: {
        requestId_developerId: {
          requestId: id,
          developerId: me.user.id,
        },
      },
      update: {
        message: parsed.data.message,
        proposedPrice: parsed.data.proposedPrice ?? null,
        deliveryDays: parsed.data.deliveryDays ?? null,
        projectId: parsed.data.projectId || null,
        status: "PENDING",
      },
      create: {
        requestId: id,
        developerId: me.user.id,
        message: parsed.data.message,
        proposedPrice: parsed.data.proposedPrice ?? null,
        deliveryDays: parsed.data.deliveryDays ?? null,
        projectId: parsed.data.projectId || null,
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            university: true,
          },
        },
        project: {
          select: { id: true, title: true, slug: true, price: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.buyerId,
        title: `New offer from ${me.user.name}`,
        message: parsed.data.message.slice(0, 140),
        link: `/requests/${id}`,
      },
    });

    return jsonSecure({ success: true, offer: mapOffer(offer) });
  } catch (err) {
    console.error("[requests.id.offer]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Could not submit offer" },
      { status: 500 }
    );
  }
}
