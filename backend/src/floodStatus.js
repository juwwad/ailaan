import { boundingBox, DISTRICTS } from "./districts.js";

// Google Flood Forecasting API severity -> Ailaan risk level.
const SEVERITY_TO_RISK = {
  SEVERITY_NORMAL: "low",
  SEVERITY_WARNING: "medium",
  SEVERITY_ALERT: "high",
  SEVERITY_UNKNOWN: "low",
};

export function severityToRisk(severity) {
  return SEVERITY_TO_RISK[severity] || "low";
}

/**
 * Normalise a raw Google `floodStatuses[]` array into Ailaan's flat shape.
 * Returns null when Google has no status for the requested area, so the caller
 * can fall back to simulated data instead of reporting a false "all clear".
 */
export function normalizeFloodStatuses(floodStatuses) {
  if (!Array.isArray(floodStatuses) || floodStatuses.length === 0) return null;

  const status = floodStatuses[0];
  const inundationMapSet = status.inundationMapSet || [];
  return {
    risk: severityToRisk(status.severity),
    severity: status.severity || "SEVERITY_UNKNOWN",
    gaugeLocation: status.gaugeLocation || null,
    issuedTime: status.issuedTime || null,
    forecastTrend: status.forecastTrend || null,
    hasInundationMap: inundationMapSet.length > 0,
    source: "google-flood-forecasting",
  };
}

const GOOGLE_BASE_URL = "https://floodforecasting.googleapis.com/v1";

async function fetchFromGoogle(districtKey, apiKey, { signal } = {}) {
  const url = `${GOOGLE_BASE_URL}/floodStatus:searchLatestFloodStatusByArea?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      loop: { vertices: boundingBox(districtKey) },
      includeNonQualityVerified: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Google Flood API responded ${response.status}`);
  }
  const data = await response.json();
  return normalizeFloodStatuses(data.floodStatuses);
}

/**
 * Resolve the flood status for a district.
 *
 * Always returns a response body. When Google has data it is marked
 * `source: "google-flood-forecasting"`. Otherwise (no API key configured,
 * upstream error, or no status for the area) it returns simulated data with
 * `source: "simulated"` and `simulated: true` so the UI can label it honestly.
 */
export async function getFloodStatus(districtKey, { apiKey, signal } = {}) {
  const district = DISTRICTS[districtKey];
  if (!district) {
    const err = new Error(`Unknown district: ${districtKey}`);
    err.statusCode = 400;
    throw err;
  }

  if (apiKey) {
    try {
      const normalized = await fetchFromGoogle(districtKey, apiKey, { signal });
      if (normalized) return { district: districtKey, ...normalized };
    } catch (error) {
      // Fall through to simulated data; the reason is surfaced via `simulated`.
      return {
        district: districtKey,
        ...simulatedStatus(districtKey),
        upstreamError: error.message,
      };
    }
  }

  return { district: districtKey, ...simulatedStatus(districtKey) };
}

// Static, illustrative values. They are intentionally flagged as simulated and
// must never be presented to end users as live flood data.
const SIMULATED = {
  nowshera: { risk: "high", trend: "RISING", discharge: 452000 },
  charsadda: { risk: "medium", trend: "RISING", discharge: 318000 },
  peshawar: { risk: "medium", trend: "RISING", discharge: 244000 },
  swat: { risk: "low", trend: "STEADY", discharge: 176000 },
  mardan: { risk: "low", trend: "STEADY", discharge: 151000 },
};

function simulatedStatus(districtKey) {
  const sim = SIMULATED[districtKey] || { risk: "low", trend: "STEADY", discharge: 0 };
  return {
    risk: sim.risk,
    severity:
      sim.risk === "high"
        ? "SEVERITY_ALERT"
        : sim.risk === "medium"
          ? "SEVERITY_WARNING"
          : "SEVERITY_NORMAL",
    gaugeLocation: DISTRICTS[districtKey]?.name || districtKey,
    issuedTime: null,
    forecastTrend: sim.trend,
    discharge: sim.discharge,
    hasInundationMap: false,
    source: "simulated",
    simulated: true,
  };
}
