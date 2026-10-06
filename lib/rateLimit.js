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
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 30);

let warnedAboutMemoryStore = false;

// --- In-memory fallback (per serverless instance) -------------------------

const buckets = new Map();

function memoryLimit(key, now) {
  const windowStart = now - (now % (WINDOW_SECONDS * 1000));
  const entry = buckets.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    buckets.set(key, { windowStart, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1, reset: windowStart + WINDOW_SECONDS * 1000 };
  }

  entry.count += 1;
  const allowed = entry.count <= MAX_REQUESTS;
  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    reset: windowStart + WINDOW_SECONDS * 1000,
  };
}

// --- Upstash Redis REST limiter -------------------------------------------

async function upstashLimit(key, now, url, token) {
  const windowStart = now - (now % (WINDOW_SECONDS * 1000));
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
    reset: windowStart + WINDOW_SECONDS * 1000,
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

export function clientKeyFromHeaders(headers) {
  const forwarded = headers.get?.("x-forwarded-for") ?? headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get?.("x-real-ip") ?? headers["x-real-ip"] ?? "unknown";
}

export const RATE_LIMIT = { windowSeconds: WINDOW_SECONDS, maxRequests: MAX_REQUESTS };
