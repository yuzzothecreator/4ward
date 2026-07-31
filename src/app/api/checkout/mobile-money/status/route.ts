import { NextResponse } from "next/server";
import {
  getPendingPayment,
  isClickPesaConfigured,
  queryPaymentStatus,
  updatePendingPayment,
} from "@/lib/clickpesa";
import { fulfillClickPesaOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Poll ClickPesa payment status and fulfill purchase when paid.
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

    const pending = await getPendingPayment(orderReference);

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
    const collectedAmount =
      latest?.collectedAmount !== undefined
        ? Math.round(Number(latest.collectedAmount))
        : undefined;

    await updatePendingPayment(orderReference, {
      status,
      message: latest?.message,
      channel: latest?.channel || pending?.channel,
      clickpesaId: latest?.id || pending?.clickpesaId,
      ...(collectedAmount !== undefined && Number.isFinite(collectedAmount)
        ? { collectedAmount }
        : {}),
    });

    const paid = status === "SUCCESS" || status === "SETTLED";
    let purchase = null;
    let fulfillError: string | undefined;
    let fulfillCode: string | undefined;

    if (paid) {
      const result = await fulfillClickPesaOrder(orderReference, {
        collectedAmount:
          collectedAmount !== undefined && Number.isFinite(collectedAmount)
            ? collectedAmount
            : undefined,
      });
      if (result.ok) {
        purchase = result.purchase;
      } else {
        fulfillError = result.error;
        fulfillCode = "code" in result ? result.code : undefined;
      }
    }

    const updated = await getPendingPayment(orderReference);

    return NextResponse.json({
      orderReference,
      status: fulfillError ? "FAILED" : status,
      paid: Boolean(purchase),
      channel: updated?.channel || latest?.channel,
      amount: updated?.amount ?? latest?.collectedAmount,
      currency: "TZS",
      projectId: updated?.projectId,
      slug: updated?.slug,
      title: updated?.title,
      message: fulfillError || latest?.message || updated?.message,
      error: fulfillError,
      code: fulfillCode,
      purchase,
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
