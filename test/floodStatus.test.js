import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFloodStatuses,
  severityToRisk,
  simulatedStatus,
  fetchLiveFloodStatus,
} from "../lib/floodStatus.js";
import {
  isValidDistrict,
  boundingBox,
  DISTRICT_KEYS,
} from "../lib/districts.js";

test("severityToRisk maps known severities and refuses to guess", () => {
  assert.equal(severityToRisk("SEVERITY_ALERT"), "high");
  assert.equal(severityToRisk("SEVERITY_WARNING"), "medium");
  assert.equal(severityToRisk("SEVERITY_NORMAL"), "low");
  // Unknown or unrecognised must never read as a safe "low" (issue #31).
  assert.equal(severityToRisk("SEVERITY_UNKNOWN"), null);
  assert.equal(severityToRisk("SOMETHING_ELSE"), null);
  assert.equal(severityToRisk(undefined), null);
});

test("normalizeFloodStatuses maps the first Google status", () => {
  const out = normalizeFloodStatuses([
    {
      severity: "SEVERITY_ALERT",
      gaugeLocation: "Kabul River at Nowshera",
      issuedTime: "2026-01-01T00:00:00Z",
      forecastTrend: "RISING",
      inundationMapSet: ["map-1"],
    },
  ]);
  assert.equal(out.risk, "high");
  assert.equal(out.severity, "SEVERITY_ALERT");
  assert.equal(out.gaugeLocation, "Kabul River at Nowshera");
  assert.equal(out.hasInundationMap, true);
  assert.equal(out.source, "google-flood-forecasting");
});

test("normalizeFloodStatuses returns null for empty/missing statuses", () => {
  assert.equal(normalizeFloodStatuses([]), null);
  assert.equal(normalizeFloodStatuses(undefined), null);
  assert.equal(normalizeFloodStatuses(null), null);
});

test("normalizeFloodStatuses carries an unknown severity through as risk null", () => {
  const out = normalizeFloodStatuses([{ severity: "SEVERITY_UNKNOWN" }]);
  assert.equal(out.risk, null);
  assert.equal(out.severity, "SEVERITY_UNKNOWN");
  assert.equal(out.source, "google-flood-forecasting");
});

test("isValidDistrict accepts known keys and rejects others", () => {
  for (const key of DISTRICT_KEYS) assert.equal(isValidDistrict(key), true);
  assert.equal(isValidDistrict("karachi"), false);
  assert.equal(isValidDistrict("__proto__"), false);
  assert.equal(isValidDistrict(""), false);
  assert.equal(isValidDistrict(null), false);
});

test("boundingBox builds a 4-vertex square around the district", () => {
  const box = boundingBox("nowshera");
  assert.equal(box.length, 4);
  assert.ok(
    box.every(
      (v) => typeof v.latitude === "number" && typeof v.longitude === "number",
    ),
  );
  assert.equal(boundingBox("nope"), null);
});

test("simulatedStatus is always flagged as simulated", () => {
  const s = simulatedStatus("nowshera");
  assert.equal(s.simulated, true);
  assert.equal(s.source, "simulated");
  assert.equal(s.risk, "high");
  assert.equal(s.discharge, 452000);
});

test("simulatedStatus maps each risk level to the matching severity", () => {
  const expected = {
    nowshera: "SEVERITY_ALERT",
    charsadda: "SEVERITY_WARNING",
    peshawar: "SEVERITY_WARNING",
    swat: "SEVERITY_NORMAL",
    mardan: "SEVERITY_NORMAL",
  };
  for (const [district, severity] of Object.entries(expected)) {
    assert.equal(simulatedStatus(district).severity, severity, district);
  }
});

test("fetchLiveFloodStatus throws on a non-OK upstream response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 403 });
  try {
    await assert.rejects(
      () => fetchLiveFloodStatus("swat", { apiKey: "fake" }),
      /403/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
