import { NextResponse } from "next/server";
import {
  getPendingPayment,
  updatePendingPayment,
  verifyClickPesaChecksum,
  type ClickPesaPaymentStatus,
} from "@/lib/clickpesa";
import { getEnvConfig } from "@/lib/env";
import { fulfillClickPesaOrder } from "@/lib/orders";
import {
  assertProductionPaymentsReady,
  isProductionRuntime,
} from "@/lib/production";

export const dynamic = "force-dynamic";

type WebhookBody = {
  event?: string;
  data?: {
    id?: string;
    status?: ClickPesaPaymentStatus;
    orderReference?: string;
    collectedAmount?: string | number;
    collectedCurrency?: string;
    message?: string;
    channel?: string;
    paymentReference?: string;
  };
  checksum?: string;
  checksumMethod?: string;
};

/**
 * ClickPesa application webhook — fulfills Purchase + Transaction on success.
 */
export async function POST(req: Request) {
  try {
    const prodBlock = assertProductionPaymentsReady();
    if (prodBlock) {
      console.error("[clickpesa.webhook]", prodBlock);
      return NextResponse.json({ error: prodBlock }, { status: 503 });
    }

    const body = (await req.json()) as WebhookBody;
    const env = getEnvConfig();

    if (isProductionRuntime() || env.clickpesaChecksumEnabled) {
      if (!env.clickpesaChecksumKey) {
        return NextResponse.json(
          { error: "Webhook checksum key not configured" },
          { status: 503 }
        );
      }
      if (!body.checksum) {
        return NextResponse.json(
          { error: "Missing checksum" },
          { status: 401 }
        );
      }
      const valid = verifyClickPesaChecksum(
        env.clickpesaChecksumKey,
        body as unknown as Record<string, unknown>,
        body.checksum
      );
      if (!valid) {
        console.warn("[clickpesa.webhook] invalid checksum");
        return NextResponse.json({ error: "Invalid checksum" }, { status: 401 });
      }
    }

    const event = body.event || "";
    const orderReference = body.data?.orderReference;
    const status = body.data?.status;

    if (!orderReference) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const pending = await getPendingPayment(orderReference);
    const collectedRaw = body.data?.collectedAmount;
    const collectedAmount =
      collectedRaw === undefined || collectedRaw === null
        ? undefined
        : Math.round(Number(collectedRaw));

    if (event === "PAYMENT RECEIVED" || status === "SUCCESS" || status === "SETTLED") {
      await updatePendingPayment(orderReference, {
        status: "SUCCESS",
        channel: body.data?.channel,
        clickpesaId: body.data?.id,
        message: body.data?.message || "Payment received",
        ...(collectedAmount !== undefined && Number.isFinite(collectedAmount)
          ? { collectedAmount }
          : {}),
      });

      const result = await fulfillClickPesaOrder(orderReference, {
        collectedAmount:
          collectedAmount !== undefined && Number.isFinite(collectedAmount)
            ? collectedAmount
            : undefined,
      });
      console.info("[audit] clickpesa.webhook.fulfilled", {
        event,
        orderReference,
        ok: result.ok,
        purchaseId: result.ok ? result.purchase.id : undefined,
        knownOrder: Boolean(pending),
        error: result.ok ? undefined : result.error,
      });

      if (!result.ok) {
        return NextResponse.json(
          {
            received: true,
            fulfilled: false,
            error: result.error,
            code: "code" in result ? result.code : undefined,
          },
          { status: result.error === "Unknown order reference" ? 404 : 409 }
        );
      }

      return NextResponse.json({
        received: true,
        fulfilled: true,
        purchaseId: result.purchase.id,
      });
    }

    if (event === "PAYMENT FAILED" || status === "FAILED") {
      await updatePendingPayment(orderReference, {
        status: "FAILED",
        channel: body.data?.channel,
        clickpesaId: body.data?.id,
        message: body.data?.message || "Payment failed",
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[clickpesa.webhook]", err);
    return NextResponse.json(
      {
        received: false,
        error: err instanceof Error ? err.message : "Webhook failed",
      },
      { status: 500 }
    );
  }
}
