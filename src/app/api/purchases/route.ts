import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * List completed purchases for a buyer email (demo + production).
 * GET /api/purchases?email=
 */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const db = await pingDatabase();
  if (!db.ok) {
    return NextResponse.json({
      purchases: [],
      demo: true,
      warning: db.error,
    });
  }

  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ purchases: [], demo: false });
    }

    const rows = await prisma.purchase.findMany({
      where: { buyerId: user.id, paymentStatus: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          include: {
            seller: { select: { name: true, username: true } },
          },
        },
      },
    });

    return NextResponse.json({
      purchases: rows.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        slug: p.project.slug,
        title: p.project.title,
        coverImage: p.project.coverImage || "",
        price: p.amount,
        sellerName: p.project.seller.name,
        purchasedAt: p.createdAt.toISOString(),
        downloadToken: p.downloadToken,
        paymentGateway: p.paymentGateway,
      })),
      demo: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        purchases: [],
        error: err instanceof Error ? err.message : "Failed to load purchases",
      },
      { status: 500 }
    );
  }
}
