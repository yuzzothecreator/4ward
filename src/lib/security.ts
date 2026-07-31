import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAdminSessionSecret, isProductionRuntime } from "@/lib/admin-config";

const ADMIN_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSigningSecret() {
  try {
    return getAdminSessionSecret();
  } catch {
    if (isProductionRuntime()) throw new Error("ADMIN_SESSION_SECRET required");
    return (
      process.env.ADMIN_SESSION_SECRET ||
      process.env.CLICKPESA_API_KEY ||
      process.env.CLERK_SECRET_KEY ||
      "4ward-dev-insecure-admin-secret"
    );
  }
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** Strip tags / control chars from free-text fields. */
export function sanitizeText(input: unknown, maxLen = 200): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>`'"]/g, "")
    .trim()
    .slice(0, maxLen);
}

/** Preserve newlines for bios / support notes (unlike sanitizeText). */
export function sanitizeMultiline(input: unknown, maxLen = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>`'"]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLen);
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Reject cross-site mutating requests (basic CSRF defense).
 * Allows missing Origin only when Referer host matches.
 */
export function assertSameOrigin(req: Request): boolean {
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const allowedHosts = new Set<string>();
  if (host) allowedHosts.add(host.toLowerCase());
  if (appUrl) {
    try {
      allowedHosts.add(new URL(appUrl).host.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  // Local dev convenience
  allowedHosts.add("localhost:3000");
  allowedHosts.add("127.0.0.1:3000");

  if (origin) {
    try {
      return allowedHosts.has(new URL(origin).host.toLowerCase());
    } catch {
      return false;
    }
  }

  const referer = req.headers.get("referer");
  if (!referer) return false;
  try {
    return allowedHosts.has(new URL(referer).host.toLowerCase());
  } catch {
    return false;
  }
}

export function requireSameOrigin(req: Request) {
  if (assertSameOrigin(req)) return null;
  return NextResponse.json(
    { error: "Cross-origin request blocked" },
    { status: 403 }
  );
}

export function requireRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs = 60_000
) {
  const key = `${bucket}:${clientIp(req)}`;
  const result = rateLimit(key, limit, windowMs);
  if (result.success) return null;
  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": "60" },
    }
  );
}

type AdminTokenPayload = {
  email: string;
  exp: number;
  nonce: string;
};

function encodePayload(payload: AdminTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(raw: string): AdminTokenPayload | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json) as AdminTokenPayload;
    if (!data?.email || !data?.exp || !data?.nonce) return null;
    return data;
  } catch {
    return null;
  }
}

function sign(part: string) {
  return createHmac("sha256", getSigningSecret()).update(part).digest("base64url");
}

/** Issue a short-lived admin bearer token (prevents email-header spoofing). */
export function issueAdminSessionToken(email: string) {
  const payload: AdminTokenPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + ADMIN_TOKEN_TTL_MS,
    nonce: randomBytes(8).toString("hex"),
  };
  const body = encodePayload(payload);
  const sig = sign(body);
  return {
    token: `${body}.${sig}`,
    expiresAt: new Date(payload.exp).toISOString(),
    expiresIn: ADMIN_TOKEN_TTL_MS / 1000,
  };
}

export function verifyAdminSessionToken(token: string | null | undefined): {
  ok: boolean;
  email?: string;
  error?: string;
} {
  if (!token) return { ok: false, error: "Missing admin session token" };
  const cleaned = token.startsWith("Bearer ") ? token.slice(7) : token;
  const [body, sig] = cleaned.split(".");
  if (!body || !sig) return { ok: false, error: "Malformed admin token" };

  const expected = sign(body);
  if (!safeEqual(sig, expected)) {
    return { ok: false, error: "Invalid admin token signature" };
  }

  const payload = decodePayload(body);
  if (!payload) return { ok: false, error: "Invalid admin token payload" };
  if (Date.now() > payload.exp) {
    return { ok: false, error: "Admin session expired — sign in again" };
  }

  return { ok: true, email: payload.email };
}

export function securityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export function jsonSecure(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  return securityHeaders(res);
}
