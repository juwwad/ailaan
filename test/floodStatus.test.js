import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFloodStatuses,
  severityToRisk,
  simulatedStatus,
  getFloodStatus,
  fetchLiveFloodStatus,
} from "../lib/floodStatus.js";
import {
  isValidDistrict,
  boundingBox,
  DISTRICT_KEYS,
} from "../lib/districts.js";

test("severityToRisk maps every Google severity", () => {
  assert.equal(severityToRisk("SEVERITY_ALERT"), "high");
  assert.equal(severityToRisk("SEVERITY_WARNING"), "medium");
  assert.equal(severityToRisk("SEVERITY_NORMAL"), "low");
  assert.equal(severityToRisk("SEVERITY_UNKNOWN"), "low");
  assert.equal(severityToRisk(undefined), "low");
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

test("getFloodStatus returns simulated data without an API key", async () => {
  const status = await getFloodStatus("nowshera", {});
  assert.equal(status.district, "nowshera");
  assert.equal(status.simulated, true);
  assert.equal(status.source, "simulated");
});

test("getFloodStatus returns live data when the upstream responds", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      floodStatuses: [{ severity: "SEVERITY_WARNING", inundationMapSet: [] }],
    }),
  });
  try {
    const status = await getFloodStatus("mardan", { apiKey: "fake" });
    assert.equal(status.source, "google-flood-forecasting");
    assert.equal(status.risk, "medium");
    assert.equal(status.simulated, undefined);
  } finally {
    globalThis.fetch = original;
  }
});

test("getFloodStatus falls back to simulated data on upstream failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network down");
  };
  try {
    const status = await getFloodStatus("swat", { apiKey: "fake" });
    assert.equal(status.simulated, true);
    assert.equal(status.source, "simulated");
  } finally {
    globalThis.fetch = original;
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
