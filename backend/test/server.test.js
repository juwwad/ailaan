import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import {
  normalizeFloodStatuses,
  severityToRisk,
  getFloodStatus,
} from "../src/floodStatus.js";
import { isValidDistrict, boundingBox, DISTRICT_KEYS } from "../src/districts.js";
import { server } from "../server.js";

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

test("getFloodStatus returns simulated data without an API key", async () => {
  const status = await getFloodStatus("nowshera", {});
  assert.equal(status.district, "nowshera");
  assert.equal(status.simulated, true);
  assert.equal(status.source, "simulated");
  assert.equal(status.risk, "high");
  assert.equal(status.discharge, 452000);
});

test("getFloodStatus falls back to simulated data on upstream failure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network down");
  };
  try {
    const status = await getFloodStatus("swat", { apiKey: "fake" });
    assert.equal(status.simulated, true);
    assert.equal(status.upstreamError, "network down");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getFloodStatus returns live data when the upstream responds", async () => {
  const originalFetch = globalThis.fetch;
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
    globalThis.fetch = originalFetch;
  }
});

test("getFloodStatus rejects an unknown district with 400", async () => {
  await assert.rejects(
    () => getFloodStatus("karachi", {}),
    (err) => err.statusCode === 400,
  );
});

async function withServer(fn) {
  server.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("HTTP: /health returns ok and the district list", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.deepEqual(body.districts, DISTRICT_KEYS);
  });
});

test("HTTP: POST /api/flood-status returns a status for a valid district", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/flood-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district: "peshawar", coordinates: [] }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.district, "peshawar");
    assert.equal(body.simulated, true);
  });
});

test("HTTP: POST /api/flood-status rejects an invalid district with 400", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/flood-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district: "karachi" }),
    });
    assert.equal(res.status, 400);
  });
});

test("HTTP: POST /api/flood-status rejects malformed JSON with 400", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/flood-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    assert.equal(res.status, 400);
  });
});

test("HTTP: unknown route returns 404", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});
