import { positiveIntEnv } from "./env.js";

// Best-effort rate limiting for the public /api/flood-status endpoint.
//
// Serverless functions are stateless, so an in-memory counter is per-instance
// and only useful for local development. In production we use Upstash Redis
// over its REST API (no SDK dependency, works on Vercel's edge/node runtimes).
//
// Configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable the
// distributed limiter. Without them the in-memory limiter is used and a warning
// is logged once per instance.

const WINDOW_SECONDS = 60;
const WINDOW_MS = WINDOW_SECONDS * 1000;
// A non-numeric RATE_LIMIT_MAX would make every `count <= MAX_REQUESTS`
// comparison false and deny all traffic; validate instead of trusting Number().
const MAX_REQUESTS = positiveIntEnv(process.env.RATE_LIMIT_MAX, 30, "RATE_LIMIT_MAX");

// How many proxies we trust to have appended to `x-forwarded-for`. Each trusted
// hop adds one entry on the right, so the real client is that many entries from
// the end. A client can prepend arbitrary values (they land on the left), so the
// right-most entry is the one we trust, never the left-most.
//
// A non-numeric value would make `hops.length - TRUSTED_PROXY_HOPS` NaN and every
// client collapse into one bucket, so validate it like the other numeric config.
const TRUSTED_PROXY_HOPS = positiveIntEnv(
  process.env.TRUSTED_PROXY_HOPS,
  1,
  "TRUSTED_PROXY_HOPS",
);

// `x-real-ip` is only trustworthy on a platform that sets it and overwrites any
// inbound value. Vercel does; a generic host (Cloud Run, a bare Node server) does
// not, so there a client-supplied `x-real-ip` would mint a fresh rate-limit bucket
// per request — the same bypass as #33 via a different header (#65).
function platformSetsRealIp() {
  return Boolean(process.env.VERCEL);
}

let warnedAboutMemoryStore = false;

// --- In-memory fallback (per serverless instance) -------------------------

const buckets = new Map();

function memoryLimit(key, now) {
  const windowStart = now - (now % WINDOW_MS);
  const entry = buckets.get(key);

  if (entry?.windowStart !== windowStart) {
    // Lazy sweep so keys that are never seen again do not accumulate forever
    // on a long-lived process. Cheap: it runs at most once per window.
    if (entry === undefined) sweepExpired(now);
    buckets.set(key, { windowStart, count: 1 });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      reset: windowStart + WINDOW_MS,
    };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    reset: windowStart + WINDOW_MS,
  };
}

// Drop buckets whose window has closed; they can never be read again.
function sweepExpired(now) {
  const windowStart = now - (now % WINDOW_MS);
  for (const [key, entry] of buckets) {
    if (entry.windowStart < windowStart) buckets.delete(key);
  }
}

// Number of live buckets. Exposed so tests (and ops) can observe memory pressure.
export function bucketCount() {
  return buckets.size;
}

// --- Upstash Redis REST limiter -------------------------------------------

async function upstashLimit(key, now, url, token) {
  const windowStart = now - (now % WINDOW_MS);
  const redisKey = `ailaan:rl:${key}:${windowStart}`;

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // INCR then set the TTL on first hit.
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(WINDOW_SECONDS), "NX"],
    ]),
  });

  if (!response.ok) throw new Error(`Upstash responded ${response.status}`);

  const results = await response.json();
  const count = Number(results?.[0]?.result ?? 1);
  const allowed = count <= MAX_REQUESTS;
  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS - count),
    reset: windowStart + WINDOW_MS,
  };
}

/**
 * Check whether a request identified by `key` (e.g. client IP) is allowed.
 * Never throws: on any limiter failure it fails open so a Redis outage cannot
 * take the flood-warning endpoint down.
 */
export async function checkRateLimit(key, { url, token, now = Date.now() } = {}) {
  const redisUrl = url ?? process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = token ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      return await upstashLimit(key, now, redisUrl, redisToken);
    } catch {
      // fall through to in-memory so the endpoint keeps working
    }
  } else if (!warnedAboutMemoryStore) {
    warnedAboutMemoryStore = true;
    console.warn(
      "Rate limiting is using the in-memory store (per-instance). Set UPSTASH_REDIS_REST_URL/TOKEN for distributed limits.",
    );
  }

  return memoryLimit(key, now);
}

/**
 * Derive the rate-limit key from request headers.
 *
 * `x-forwarded-for` is `client, proxy1, proxy2, …`: each proxy appends the peer
 * it saw, so with `n` trusted proxies the real client is the `n`-th entry from
 * the end. The left-most entry is whatever the client sent and is therefore
 * attacker-controlled — keying off it lets a caller mint a fresh bucket per
 * request with `X-Forwarded-For: <random>` and bypass the limit entirely (#33).
 *
 * Vercel sets `x-real-ip` to the true client and overwrites any inbound value,
 * so it is preferred when present — but only there. On a host that does not set
 * the header, trusting it would let a caller choose its own rate-limit bucket.
 * Otherwise we take the right-most entry, counting back `TRUSTED_PROXY_HOPS`
 * (default 1). Behaviour is documented in `.env.example` and the README.
 */
export function clientKeyFromHeaders(headers) {
  if (platformSetsRealIp()) {
    const realIp = headers.get?.("x-real-ip") ?? headers["x-real-ip"];
    if (realIp) return realIp.trim();
  }

  const forwarded = headers.get?.("x-forwarded-for") ?? headers["x-forwarded-for"];
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    // A chain shorter than the trusted hop count means the request did not
    // arrive through the expected proxies. Every entry present is then
    // client-supplied, so refuse to key off any of them rather than falling
    // back to the spoofable left-most value (#33, #62).
    if (hops.length >= TRUSTED_PROXY_HOPS) {
      return hops[hops.length - TRUSTED_PROXY_HOPS];
    }
  }

  return "unknown";
}

export const RATE_LIMIT = { windowSeconds: WINDOW_SECONDS, maxRequests: MAX_REQUESTS };
