interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter for protecting sensitive authentication endpoints.
 * @param identifier Unique key e.g. `auth:password:userId` or `auth:login:ip`
 * @param maxAttempts Maximum permitted attempts in the given window (default: 5)
 * @param windowMs Window duration in milliseconds (default: 5 minutes)
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxAttempts) {
    const resetInSeconds = Math.ceil(Math.max(0, record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Resets the rate limit counter for an identifier upon successful authentication.
 */
export function resetRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}
