/**
 * lib/rate-limit.ts
 *
 * Lightweight in-process rate limiter using a Map.
 * Works correctly on a single Vercel serverless instance.
 *
 * For multi-region or high-traffic production use, swap the Map for an
 * Upstash Redis store:  https://github.com/upstash/ratelimit
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rate-limit";
 *
 *   const rl = rateLimit({ windowMs: 60_000, max: 20 }); // 20 req/min
 *
 *   const { ok, retryAfter } = rl.check(ip);
 *   if (!ok) return NextResponse.json({ error: "Too many requests" }, {
 *     status: 429,
 *     headers: { "Retry-After": String(retryAfter) },
 *   });
 */

interface Entry {
  count:      number;
  resetAt:    number;
}

interface Options {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window per key */
  max:      number;
}

interface Result {
  ok:         boolean;
  remaining:  number;
  retryAfter: number;  // seconds until window resets
}

export function rateLimit(options: Options) {
  const { windowMs, max } = options;
  const store = new Map<string, Entry>();

  // Prune expired entries periodically to avoid unbounded memory growth.
  // Each call to check() cleans up if >60 s since last prune.
  let lastPruned = Date.now();

  function prune() {
    const now = Date.now();
    if (now - lastPruned < 60_000) return;
    lastPruned = now;
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }

  return {
    check(key: string): Result {
      prune();
      const now = Date.now();
      let entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        entry = { count: 1, resetAt: now + windowMs };
        store.set(key, entry);
        return { ok: true, remaining: max - 1, retryAfter: 0 };
      }

      entry.count++;
      const remaining  = Math.max(0, max - entry.count);
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      return { ok: entry.count <= max, remaining, retryAfter };
    },
  };
}

// ─── Shared limiters ─────────────────────────────────────────────────────────

/** Upload: 10 uploads per minute per user. */
export const uploadLimiter   = rateLimit({ windowMs: 60_000,  max: 10  });

/** Chat: 30 questions per minute per user. */
export const chatLimiter     = rateLimit({ windowMs: 60_000,  max: 30  });

/** Auth/payment: 5 attempts per 10 minutes per IP. */
export const paymentLimiter  = rateLimit({ windowMs: 600_000, max: 5   });
