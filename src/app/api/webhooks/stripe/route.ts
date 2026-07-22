import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { calculateFees } from "@/lib/stripe";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const amount = (session.amount_total || 0) / 100;
      const fees = calculateFees(amount);

      console.info("[audit] payment.verified", {
        sessionId: session.id,
        projectId: session.metadata?.projectId,
        amount,
        ...fees,
      });

      // Persist Purchase + Transaction + AffiliateEarning via Prisma in production
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
