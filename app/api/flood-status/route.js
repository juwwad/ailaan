import { unstable_cache } from "next/cache";
import { isValidDistrict, DISTRICT_KEYS } from "@/lib/districts";
import { fetchLiveFloodStatus, simulatedStatus } from "@/lib/floodStatus";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rateLimit";

const CACHE_SECONDS = Number(process.env.FLOOD_CACHE_SECONDS || 300);
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 10000);

// Only successful live results are cached. If Google has no data we throw so the
// (simulated) fallback is generated per request and recovery is immediate
// instead of being frozen into the cache for the whole revalidate window.
const cachedLiveStatus = unstable_cache(
  async (district) => {
    const normalized = await fetchLiveFloodStatus(district, {
      apiKey: process.env.GOOGLE_FLOOD_API_KEY,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!normalized) throw new Error("No live flood status for area");
    return { district, ...normalized };
  },
  ["flood-status-live"],
  { revalidate: CACHE_SECONDS, tags: ["flood-status"] },
);

function json(body, status, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export async function POST(req) {
  const limit = await checkRateLimit(clientKeyFromHeaders(req.headers));
  if (!limit.allowed) {
    return json(
      { error: "Too many requests. Please try again shortly." },
      429,
      {
        "Retry-After": String(
          Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)),
        ),
      },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Malformed JSON body" }, 400);
  }

  const district = body?.district;
  if (!isValidDistrict(district)) {
    return json(
      {
        error: `Unknown or missing district. Expected one of: ${DISTRICT_KEYS.join(", ")}`,
      },
      400,
    );
  }

  if (!process.env.GOOGLE_FLOOD_API_KEY) {
    return json(simulatedStatus(district), 200);
  }

  try {
    const status = await cachedLiveStatus(district);
    return json(status, 200);
  } catch {
    // Upstream unavailable / no data — degrade to clearly-labeled simulated data.
    return json(simulatedStatus(district), 200);
  }
}
