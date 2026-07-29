import { NextResponse } from "next/server";
import {
  getPendingPayment,
  isClickPesaConfigured,
  queryPaymentStatus,
  updatePendingPayment,
} from "@/lib/clickpesa";

export const dynamic = "force-dynamic";

/**
 * Poll ClickPesa payment status by orderReference.
 * GET /api/checkout/mobile-money/status?orderReference=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderReference = searchParams.get("orderReference")?.trim();

    if (!orderReference) {
      return NextResponse.json(
        { error: "orderReference is required" },
        { status: 400 }
      );
    }

    const pending = getPendingPayment(orderReference);

    if (!isClickPesaConfigured()) {
      return NextResponse.json({
        orderReference,
        status: pending?.status || "FAILED",
        pending,
        demo: true,
        error: "ClickPesa not configured",
      });
    }

    const remote = await queryPaymentStatus(orderReference);
    const latest = Array.isArray(remote.data) ? remote.data[0] : undefined;
    const status = latest?.status || pending?.status || "PROCESSING";

    const updated = updatePendingPayment(orderReference, {
      status,
      message: latest?.message,
      channel: latest?.channel || pending?.channel,
      clickpesaId: latest?.id || pending?.clickpesaId,
    });

    const paid = status === "SUCCESS" || status === "SETTLED";

    return NextResponse.json({
      orderReference,
      status,
      paid,
      channel: updated?.channel || latest?.channel,
      amount: updated?.amount ?? latest?.collectedAmount,
      currency: "TZS",
      projectId: updated?.projectId,
      slug: updated?.slug,
      title: updated?.title,
      message: latest?.message || updated?.message,
    });
  } catch (err) {
    console.error("[clickpesa] status failed", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}
