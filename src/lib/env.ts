/**
 * Central env / backend capability detection.
 * Never throws at import time — callers check flags and degrade gracefully.
 */

function present(value: string | undefined | null) {
  return Boolean(value && value.trim().length > 0);
}

export type BackendStatus = {
  configured: boolean;
  ready: boolean;
  message: string;
};

export function getEnvConfig() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const clerkSecret = process.env.CLERK_SECRET_KEY || "";
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const clickpesaClientId = process.env.CLICKPESA_CLIENT_ID || "";
  const clickpesaApiKey = process.env.CLICKPESA_API_KEY || "";
  const clickpesaChecksumKey = process.env.CLICKPESA_CHECKSUM_KEY || "";

  return {
    databaseUrl,
    clerkPublishable,
    clerkSecret,
    stripeSecret,
    stripePublishable,
    stripeWebhook,
    supabaseUrl,
    supabaseAnon,
    supabaseService,
    appUrl,
    clickpesaClientId,
    clickpesaApiKey,
    clickpesaChecksumKey,
    clerkEnabled: present(clerkPublishable),
    clerkServerEnabled: present(clerkPublishable) && present(clerkSecret),
    stripeEnabled: present(stripeSecret),
    stripeCheckoutReady: present(stripeSecret) && present(stripePublishable),
    stripeWebhooksReady: present(stripeSecret) && present(stripeWebhook),
    clickpesaEnabled: present(clickpesaClientId) && present(clickpesaApiKey),
    clickpesaChecksumEnabled: present(clickpesaChecksumKey),
    supabaseConfigured: present(supabaseUrl) && present(supabaseService),
    databaseConfigured: present(databaseUrl),
  };
}

export function isSupabaseDatabaseUrl(url: string) {
  return /supabase\.(co|com)/i.test(url);
}

/** Normalize DATABASE_URL for Supabase (SSL + timeouts). */
export function normalizeDatabaseUrl(url: string) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (isSupabaseDatabaseUrl(url)) {
      if (!u.searchParams.has("sslmode")) {
        u.searchParams.set("sslmode", "require");
      }
      if (!u.searchParams.has("connect_timeout")) {
        u.searchParams.set("connect_timeout", "10");
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}
