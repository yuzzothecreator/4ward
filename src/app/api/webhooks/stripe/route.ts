import { NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe";
import { fulfillPurchase, PurchaseBlockedError } from "@/lib/orders";
import { demoProjects } from "@/lib/demo-data";

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
      const amount = session.amount_total || 0;
      const fees = calculateFees(amount);
      const projectId = session.metadata?.projectId || "";
      const project =
        demoProjects.find((p) => p.id === projectId) ||
        demoProjects.find((p) => p.slug === session.metadata?.slug);

      console.info("[audit] payment.verified", {
        sessionId: session.id,
        projectId,
        amount,
        ...fees,
      });

      if (project || projectId) {
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          "buyer@example.com";

        try {
          await fulfillPurchase({
            buyerEmail: email,
            buyerName: session.customer_details?.name || undefined,
            projectId: project?.id || projectId,
            slug: project?.slug || session.metadata?.slug || projectId,
            title: project?.title || "4ward project",
            amount,
            paymentGateway: "stripe",
            paymentReference: session.id,
            affiliateCode: session.metadata?.affiliateCode || undefined,
          });
        } catch (err) {
          if (err instanceof PurchaseBlockedError) {
            console.warn("[audit] stripe.fulfill.university_blocked", {
              sessionId: session.id,
              code: err.code,
              message: err.message,
            });
            // Acknowledge webhook so Stripe does not retry forever; payment may need manual refund.
            return NextResponse.json({
              received: true,
              blocked: true,
              code: err.code,
              error: err.message,
            });
          }
          throw err;
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
