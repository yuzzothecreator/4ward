import { NextResponse } from "next/server";
import { getEnvConfig } from "@/lib/env";
import { pingDatabase } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/storage";

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
    stripe: {
      configured: env.stripeEnabled,
      ready: stripeOk,
      message: stripeOk
        ? "API key valid"
        : env.stripeEnabled
          ? stripeError || "Key present but invalid"
          : "Not configured — demo checkout active",
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
        !services.stripe.ready &&
          "Add STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (test mode)",
        !services.supabaseStorage.ready &&
          "Add NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY; create bucket project-files",
      ].filter(Boolean),
    },
    { status: criticalReady ? 200 : 503 }
  );
}
