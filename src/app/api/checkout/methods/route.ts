import { NextResponse } from "next/server";
import { getEnvConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Which payment methods the checkout UI can offer. */
export async function GET() {
  const env = getEnvConfig();
  return NextResponse.json({
    methods: {
      clickpesa: {
        id: "clickpesa",
        label: "Mobile money (ClickPesa)",
        description: "M-Pesa, Mixx by Yas, Airtel Money, HaloPesa via USSD push",
        enabled: env.clickpesaEnabled,
        currency: "TZS",
      },
      stripe: {
        id: "stripe",
        label: "Card (Stripe)",
        description: "Visa / Mastercard",
        enabled: env.stripeEnabled,
        currency: "TZS",
      },
      demo: {
        id: "demo",
        label: "Demo checkout",
        description: "Local purchase without a payment gateway",
        enabled: !env.clickpesaEnabled && !env.stripeEnabled,
        currency: "TZS",
      },
    },
  });
}
