interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

let callsSinceSweep = 0;
const SWEEP_INTERVAL = 500;
const STALE_BUCKET_MS = 10 * 60 * 1000;

/**
 * Drops buckets that haven't been touched recently, so the map doesn't grow
 * forever as new users show up. Runs occasionally rather than on every call.
 */
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    const last = bucket.timestamps[bucket.timestamps.length - 1];
    if (last === undefined || now - last > STALE_BUCKET_MS) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  retryAfterSeconds?: number;
}

/**
 * Best-effort, per-instance sliding-window rate limiter — state lives in
 * memory, so it resets on cold start and isn't shared across serverless
 * instances. That makes it a deterrent against runaway loops, bugs, and
 * casual abuse rather than a hard distributed guarantee; a real fix at
 * higher scale would move this to a shared store like Upstash Redis.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  callsSinceSweep += 1;
  if (callsSinceSweep >= SWEEP_INTERVAL) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const bucket = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const retryAfterMs = bucket.timestamps[0] + windowMs - now;
    return { success: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { success: true };
}
