import { NextResponse } from "next/server";
import { getEnvConfig } from "@/lib/env";
import { pingDatabase } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/storage";
import { pingClickPesa } from "@/lib/clickpesa";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getEnvConfig();
  const db = env.databaseConfigured
    ? await pingDatabase()
    : { ok: false, error: "DATABASE_URL missing" };

  let stripeOk = false;
  let stripeError: string | undefined;
  if (env.stripeEnabled && stripe) {
    try {
      await stripe.balance.retrieve();
      stripeOk = true;
    } catch (err) {
      stripeError = err instanceof Error ? err.message : "Stripe ping failed";
    }
  }

  let clickpesaOk = false;
  let clickpesaError: string | undefined;
  if (env.clickpesaEnabled) {
    const ping = await pingClickPesa();
    clickpesaOk = ping.ok;
    clickpesaError = ping.error;
  }

  let storageOk = false;
  let storageError: string | undefined;
  if (env.supabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.storage.listBuckets();
      if (error) storageError = error.message;
      else storageOk = true;
    } catch (err) {
      storageError = err instanceof Error ? err.message : "Storage ping failed";
    }
  }

  const services = {
    database: {
      configured: env.databaseConfigured,
      ready: db.ok,
      message: db.ok
        ? "Connected (Supabase Postgres pooler)"
        : db.error || "Unreachable",
    },
    clerk: {
      configured: env.clerkEnabled,
      ready: env.clerkServerEnabled,
      message: env.clerkServerEnabled
        ? "Publishable + secret keys set"
        : env.clerkEnabled
          ? "Missing CLERK_SECRET_KEY"
          : "Not configured — demo auth active",
    },
    clickpesa: {
      configured: env.clickpesaEnabled,
      ready: clickpesaOk,
      message: clickpesaOk
        ? "API token OK — mobile money USSD push ready"
        : env.clickpesaEnabled
          ? clickpesaError || "Keys present but auth failed"
          : "Not configured — add CLICKPESA_CLIENT_ID + CLICKPESA_API_KEY",
    },
    stripe: {
      configured: env.stripeEnabled,
      ready: stripeOk,
      message: stripeOk
        ? "API key valid"
        : env.stripeEnabled
          ? stripeError || "Key present but invalid"
          : "Optional card payments",
    },
    supabaseStorage: {
      configured: env.supabaseConfigured,
      ready: storageOk,
      message: storageOk
        ? "Service role can list buckets"
        : !env.supabaseUrl
          ? "Missing NEXT_PUBLIC_SUPABASE_URL"
          : !env.supabaseService
            ? "URL set — add SUPABASE_SERVICE_ROLE_KEY + create bucket project-files"
            : storageError || "Storage check failed",
    },
  };

  const criticalReady = services.database.ready;
  const status = criticalReady ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      appUrl: env.appUrl,
      services,
      nextSteps: [
        !services.database.ready &&
          "Fix DATABASE_URL — use Supabase Session pooler (IPv4) if direct host fails",
        !services.clerk.ready &&
          "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY from Clerk dashboard",
        !services.clickpesa.ready &&
          "Add CLICKPESA_CLIENT_ID + CLICKPESA_API_KEY from merchant.clickpesa.com → Developers",
        !services.stripe.ready &&
          "Optional: Add STRIPE_SECRET_KEY for card checkout",
        !services.supabaseStorage.ready &&
          "Add NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY; create bucket project-files",
      ].filter(Boolean),
    },
    { status: criticalReady ? 200 : 503 }
  );
}
