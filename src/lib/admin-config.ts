import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Production admin identity — never hardcode passwords in the app.
 *
 * Required for production:
 *   ADMIN_EMAIL=you@company.com
 *   ADMIN_SESSION_SECRET=<64+ random hex>
 *
 * Optional:
 *   ADMIN_EMAILS=a@x.com,b@y.com   (allowlist; defaults to ADMIN_EMAIL)
 *   ADMIN_PASSWORD_HASH=scrypt$... (for non-Clerk / password admin login)
 */

function present(value: string | undefined | null) {
  return Boolean(value && value.trim().length > 0);
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

/** Canonical bootstrap admin email (from env). */
export function getAdminEmail(): string {
  const fromEnv = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (fromEnv) return fromEnv;
  // Dev-only fallback — blocked in production by assertAdminSecretsConfigured()
  return "admin@4ward.com";
}

/** Emails allowed to hold ADMIN (comma-separated). */
export function getAdminAllowlist(): string[] {
  const raw = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").trim();
  if (!raw) {
    return isProductionRuntime() ? [] : [getAdminEmail()];
  }
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const list = getAdminAllowlist();
  if (list.length === 0) return false;
  return list.includes(normalized);
}

const INSECURE_SECRET_MARKERS = [
  "change-me",
  "local-dev",
  "insecure",
  "4ward-local",
  "dev-admin-secret",
];

export function getAdminSessionSecret(): string {
  const secret = (process.env.ADMIN_SESSION_SECRET || "").trim();
  if (secret) return secret;
  if (isProductionRuntime()) {
    throw new Error(
      "ADMIN_SESSION_SECRET is required in production. Run: npm run admin:bootstrap"
    );
  }
  return "4ward-dev-only-insecure-admin-secret";
}

export function isAdminSessionSecretSecure(secret = process.env.ADMIN_SESSION_SECRET || "") {
  const s = secret.trim();
  if (s.length < 32) return false;
  const lower = s.toLowerCase();
  return !INSECURE_SECRET_MARKERS.some((m) => lower.includes(m));
}

/**
 * Fail closed in production when admin secrets are missing/weak.
 */
export function assertAdminSecretsConfigured() {
  if (!isProductionRuntime()) return;

  if (!present(process.env.ADMIN_EMAIL) && !present(process.env.ADMIN_EMAILS)) {
    throw new Error(
      "Set ADMIN_EMAIL (or ADMIN_EMAILS) in production. Run: npm run admin:bootstrap"
    );
  }
  if (!isAdminSessionSecretSecure()) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be a strong random string (32+ chars). Run: npm run admin:bootstrap"
    );
  }
}

/** scrypt hash format: scrypt$N$r$p$saltHex$hashHex */
export function hashAdminPassword(password: string): string {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyAdminPassword(
  password: string,
  storedHash = process.env.ADMIN_PASSWORD_HASH || ""
): boolean {
  if (!password || !storedHash.startsWith("scrypt$")) return false;
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 6) return false;
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], "hex");
    const expected = Buffer.from(parts[5], "hex");
    const actual = scryptSync(password, salt, expected.length, { N, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hasAdminPasswordConfigured() {
  return (process.env.ADMIN_PASSWORD_HASH || "").startsWith("scrypt$");
}

/** Generate a production-grade session secret. */
export function generateAdminSessionSecret() {
  return randomBytes(48).toString("hex");
}

export function generateTempAdminPassword() {
  // Readable enough to copy once; user should change via Clerk afterward if using Clerk
  return randomBytes(18).toString("base64url");
}

export function fingerprintSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex").slice(0, 12);
}
