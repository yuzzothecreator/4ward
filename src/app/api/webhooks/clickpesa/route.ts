import { NextResponse } from "next/server";
import {
  getPendingPayment,
  updatePendingPayment,
  verifyClickPesaChecksum,
  type ClickPesaPaymentStatus,
} from "@/lib/clickpesa";
import { getEnvConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

type WebhookBody = {
  event?: string;
  data?: {
    id?: string;
    status?: ClickPesaPaymentStatus;
    orderReference?: string;
    collectedAmount?: string;
    collectedCurrency?: string;
    message?: string;
    channel?: string;
    paymentReference?: string;
  };
  checksum?: string;
  checksumMethod?: string;
};

/**
 * ClickPesa application webhook.
 * Configure in merchant dashboard → Settings → Developers → Application webhooks:
 *   PAYMENT RECEIVED / PAYMENT FAILED → {APP_URL}/api/webhooks/clickpesa
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WebhookBody;
    const env = getEnvConfig();

    if (env.clickpesaChecksumKey && body.checksum) {
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

    const pending = getPendingPayment(orderReference);
    if (pending) {
      if (event === "PAYMENT RECEIVED" || status === "SUCCESS" || status === "SETTLED") {
        updatePendingPayment(orderReference, {
          status: "SUCCESS",
          channel: body.data?.channel,
          clickpesaId: body.data?.id,
          message: body.data?.message || "Payment received",
        });
      } else if (event === "PAYMENT FAILED" || status === "FAILED") {
        updatePendingPayment(orderReference, {
          status: "FAILED",
          channel: body.data?.channel,
          clickpesaId: body.data?.id,
          message: body.data?.message || "Payment failed",
        });
      }
    }

    console.info("[audit] clickpesa.webhook", {
      event,
      orderReference,
      status,
      channel: body.data?.channel,
      knownOrder: Boolean(pending),
    });

    // Acknowledge quickly — ClickPesa expects 2xx
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[clickpesa.webhook]", err);
    return NextResponse.json({ received: true, error: true });
  }
}
