import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { fulfillPurchase, PurchaseBlockedError } from "@/lib/orders";
import {
  requireRateLimit,
  requireSameOrigin,
  jsonSecure,
} from "@/lib/security";
import { demoProjects } from "@/lib/demo-data";
import { getPrisma, pingDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/demo
 * Free claim + offline gateway demo — still enforces university exclusivity.
 */
export async function POST(req: Request) {
  const originBlock = requireSameOrigin(req);
  if (originBlock) return originBlock;
  const limited = requireRateLimit(req, "checkout-demo", 20, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return jsonSecure({ error: "email is required" }, { status: 400 });
    }

    const catalog =
      demoProjects.find((p) => p.id === body.projectId) ||
      demoProjects.find((p) => p.slug === body.slug);

    let title = catalog?.title || String(body.title || "");
    let slug = catalog?.slug || String(body.slug || "");
    let projectId =
      catalog?.id || String(body.projectId || "") || `local_${slug || "project"}`;
    let amount = Math.round(
      Number(catalog?.price ?? body.price ?? body.amount ?? 0)
    );

    const db = await pingDatabase();
    if (db.ok && (body.projectId || body.slug)) {
      const prisma = await getPrisma();
      const row = await prisma.project.findFirst({
        where: {
          OR: [
            body.projectId ? { id: String(body.projectId) } : undefined,
            body.slug ? { slug: String(body.slug) } : undefined,
          ].filter(Boolean) as { id?: string; slug?: string }[],
        },
      });
      if (row) {
        projectId = row.id;
        slug = row.slug;
        title = row.title;
        amount = Math.round(row.price);
      }
    }

    if (!slug) {
      return jsonSecure({ error: "Missing project" }, { status: 400 });
    }

    const paymentReference = `demo_${randomBytes(10).toString("hex")}`;

    const purchase = await fulfillPurchase({
      buyerEmail: email,
      buyerName: email.split("@")[0],
      projectId,
      slug,
      title: title || slug,
      amount,
      paymentGateway: "demo",
      paymentReference,
      buyerUniversity:
        typeof body.university === "string" ? body.university : undefined,
    });

    return NextResponse.json({ success: true, purchase });
  } catch (err) {
    if (err instanceof PurchaseBlockedError) {
      return jsonSecure(
        {
          error: err.message,
          code: err.code,
          ...(err.details || {}),
        },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Checkout failed";
    return jsonSecure(
      { error: message, code: "CHECKOUT_FAILED" },
      { status: 400 }
    );
  }
}
