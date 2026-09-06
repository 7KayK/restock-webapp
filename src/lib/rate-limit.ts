/**
 * Minimal best-effort in-memory rate limiter.
 *
 * NOTE FOR KAY: this repo has no Redis/Upstash (or any shared-state) rate
 * limiting utility yet, so this keeps counts in a plain in-memory Map. That's
 * good enough to blunt casual abuse of a single warm serverless instance, but
 * it is NOT a hard guarantee — Vercel can spin up multiple instances, and
 * each cold start resets its own counts to zero. If this route ever sees
 * real abuse, swap this for something backed by shared storage (Upstash
 * Ratelimit is the common pairing with Vercel).
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  retryAfterMs: number
}

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true, retryAfterMs: 0 }
  }

  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { ok: true, retryAfterMs: 0 }
}
