/**
 * Simple in-memory rate limiter for auth endpoints.
 * Tracks attempts by IP address with a sliding window.
 * 
 * For production with multiple instances, consider Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000); // Clean every minute

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if the given key (typically IP address) is rate limited.
 * Returns true if the request should be blocked.
 */
export function isRateLimited(
  key: string,
  config: RateLimitConfig = AUTH_RATE_LIMIT
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > config.maxAttempts) {
    return true;
  }

  return false;
}

/**
 * Get the IP address from the request headers.
 * Works with x-forwarded-for (proxied) or falls back to a default.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || 'unknown';
}
