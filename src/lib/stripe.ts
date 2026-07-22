import Stripe from "stripe";
import { PLATFORM_FEE_PERCENT } from "./constants";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function calculateFees(amount: number) {
  const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
  const netAmount = Math.round(amount - platformFee);
  return { platformFee, netAmount };
}

export async function createCheckoutSession(params: {
  projectId: string;
  projectTitle: string;
  amount: number;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
  affiliateCode?: string;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.buyerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "tzs",
          // TZS is a two-decimal currency on Stripe (minor unit = senti)
          unit_amount: Math.round(params.amount * 100),
          product_data: {
            name: params.projectTitle,
            description: "Digital project purchase on 4ward",
          },
        },
      },
    ],
    metadata: {
      projectId: params.projectId,
      affiliateCode: params.affiliateCode || "",
      paymentGateway: "stripe",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

/**
 * Placeholder adapters for future African payment gateways.
 */
export const africanPaymentGateways = {
  mpesa: {
    name: "M-Pesa",
    enabled: false,
    async initiate(_amount: number, _phone: string) {
      throw new Error("M-Pesa integration coming soon");
    },
  },
  azampay: {
    name: "AzamPay",
    enabled: false,
    async initiate(_amount: number, _account: string) {
      throw new Error("AzamPay integration coming soon");
    },
  },
  selcom: {
    name: "Selcom",
    enabled: false,
    async initiate(_amount: number, _phone: string) {
      throw new Error("Selcom integration coming soon");
    },
  },
};
