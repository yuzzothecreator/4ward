import { getPrisma, pingDatabase } from "@/lib/prisma";
import { resolveRequestUser } from "@/lib/session-user";
import {
  requireRateLimit,
  requireSameOrigin,
  sanitizeText,
  jsonSecure,
} from "@/lib/security";
import { projectRequestSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function mapRequest(row: {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number | null;
  budgetMax: number | null;
  university: string | null;
  deadline: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  buyer: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    university: string | null;
  };
  _count?: { offers: number };
  offers?: unknown[];
}) {
  return {
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
    offerCount: row._count?.offers ?? row.offers?.length ?? 0,
    buyer: {
      id: row.buyer.id,
      name: row.buyer.name,
      username: row.buyer.username,
      university: row.buyer.university,
      avatar:
        row.buyer.avatar ||
        `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(row.buyer.username)}`,
    },
  };
}

/**
 * GET /api/requests
 * - Public board of open requests (default)
 * - ?mine=1&email= → current user's requests
 * - ?status=OPEN|FULFILLED|CLOSED|ALL
 * - ?category=
 * - ?q=
 */
export async function GET(req: Request) {
  const limited = requireRateLimit(req, "requests-get", 60, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ requests: [], demo: true, error: db.error }, { status: 503 });
  }

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  const status = url.searchParams.get("status") || "OPEN";
  const category = url.searchParams.get("category") || "";
  const q = url.searchParams.get("q")?.trim() || "";

  try {
    const prisma = await getPrisma();
    const where: Record<string, unknown> = {};

    if (mine) {
      const me = await resolveRequestUser(req, undefined, "view your requests");
      if ("error" in me) {
        return jsonSecure({ error: me.error }, { status: me.status });
      }
      where.buyerId = me.user.id;
      if (status !== "ALL") where.status = status;
    } else {
      where.status = status === "ALL" ? undefined : status || "OPEN";
      if (!where.status) delete where.status;
    }

    if (category) where.category = category;
    if (q.length >= 2) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { university: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.projectRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
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
        _count: { select: { offers: true } },
      },
    });

    return jsonSecure({
      requests: rows.map(mapRequest),
      demo: false,
    });
  } catch (err) {
    console.error("[requests.get]", err);
    return jsonSecure(
      {
        error: err instanceof Error ? err.message : "Failed to load requests",
        requests: [],
      },
      { status: 500 }
    );
  }
}

/** POST /api/requests — buyer posts a need */
export async function POST(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "requests-post", 20, 60_000);
  if (limited) return limited;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: db.error || "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const me = await resolveRequestUser(req, body.email, "post a request");
    if ("error" in me) {
      return jsonSecure({ error: me.error }, { status: me.status });
    }

    const parsed = projectRequestSchema.safeParse({
      title: sanitizeText(String(body.title || ""), 140),
      description: sanitizeText(String(body.description || ""), 4000),
      category: body.category,
      budgetMin: body.budgetMin === "" || body.budgetMin == null ? null : body.budgetMin,
      budgetMax: body.budgetMax === "" || body.budgetMax == null ? null : body.budgetMax,
      university:
        sanitizeText(String(body.university || me.user.university || ""), 120) || null,
      deadline: body.deadline || null,
    });

    if (!parsed.success) {
      return jsonSecure(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (
      parsed.data.budgetMin != null &&
      parsed.data.budgetMax != null &&
      parsed.data.budgetMin > parsed.data.budgetMax
    ) {
      return jsonSecure(
        { error: "Minimum budget cannot exceed maximum budget" },
        { status: 400 }
      );
    }

    let deadline: Date | null = null;
    if (parsed.data.deadline) {
      const d = new Date(parsed.data.deadline);
      if (Number.isNaN(d.getTime())) {
        return jsonSecure({ error: "Invalid deadline" }, { status: 400 });
      }
      deadline = d;
    }

    const prisma = await getPrisma();
    const row = await prisma.projectRequest.create({
      data: {
        buyerId: me.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        budgetMin: parsed.data.budgetMin ?? null,
        budgetMax: parsed.data.budgetMax ?? null,
        university: parsed.data.university || me.user.university || null,
        deadline,
      },
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
        _count: { select: { offers: true } },
      },
    });

    return jsonSecure({ success: true, request: mapRequest(row) });
  } catch (err) {
    console.error("[requests.post]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Could not create request" },
      { status: 500 }
    );
  }
}
