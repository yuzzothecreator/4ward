import { getEnvConfig } from "@/lib/env";
import { isProductionRuntime } from "@/lib/admin-config";

export { isProductionRuntime };

/** Demo / free checkout is never available in production. */
export function allowDemoCheckout() {
  if (isProductionRuntime()) return false;
  const env = getEnvConfig();
  return !env.clickpesaEnabled;
}

/**
 * Fail closed when production is missing must-have payment/auth config.
 * Call from checkout / webhook entry points.
 */
export function assertProductionPaymentsReady(): string | null {
  if (!isProductionRuntime()) return null;
  const env = getEnvConfig();
  if (!env.clerkServerEnabled) {
    return "Clerk auth (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY) is required in production.";
  }
  if (!env.databaseConfigured) {
    return "DATABASE_URL is required in production.";
  }
  if (!env.clickpesaEnabled) {
    return "ClickPesa (CLICKPESA_CLIENT_ID + CLICKPESA_API_KEY) is required in production.";
  }
  if (!env.clickpesaChecksumEnabled) {
    return "CLICKPESA_CHECKSUM_KEY is required in production for webhook verification.";
  }
  return null;
}
