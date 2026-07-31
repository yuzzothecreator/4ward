import { NextResponse } from "next/server";

/**
 * Card / Stripe checkout is temporarily disabled (coming soon).
 * Use mobile money (ClickPesa) or demo checkout instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      url: null,
      error: "Card payments are coming soon. Please pay with mobile money.",
      code: "STRIPE_COMING_SOON",
      comingSoon: true,
    },
    { status: 503 }
  );
}
