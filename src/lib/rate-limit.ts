const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for API routes.
 * Use Redis / Upstash in production for multi-instance deploys.
 */
export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}
