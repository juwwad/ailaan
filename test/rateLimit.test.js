import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bucketCount,
  checkRateLimit,
  clientKeyFromHeaders,
  RATE_LIMIT,
} from "../lib/rateLimit.js";

test("allows requests up to the limit, then denies", async () => {
  const key = `test-allow-${Math.random()}`;
  for (let i = 0; i < RATE_LIMIT.maxRequests; i += 1) {
    const res = await checkRateLimit(key);
    assert.equal(res.allowed, true, `request ${i + 1} should be allowed`);
  }
  const denied = await checkRateLimit(key);
  assert.equal(denied.allowed, false);
  assert.equal(denied.remaining, 0);
});

test("separate keys have independent budgets", async () => {
  const a = `test-a-${Math.random()}`;
  const b = `test-b-${Math.random()}`;
  for (let i = 0; i < RATE_LIMIT.maxRequests; i += 1) await checkRateLimit(a);
  assert.equal((await checkRateLimit(a)).allowed, false);
  assert.equal((await checkRateLimit(b)).allowed, true);
});

test("fails open when the distributed store is unreachable", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("redis down");
  };
  try {
    const res = await checkRateLimit(`test-failopen-${Math.random()}`, {
      url: "https://example.invalid",
      token: "x",
    });
    assert.equal(res.allowed, true);
  } finally {
    globalThis.fetch = original;
  }
});

test("stale buckets are evicted so the in-memory map cannot grow without bound", async () => {
  // Far-future timestamps so every bucket left by other tests is already stale.
  const t0 = 2_000_000_000_000_000;
  // A fresh key in a fresh window triggers a sweep, then is itself stored.
  await checkRateLimit(`evict-a-${Math.random()}`, { now: t0 });
  assert.equal(bucketCount(), 1, "the sweep cleared every earlier window");

  // One window later: the sweep runs and the previous window's bucket is gone.
  await checkRateLimit(`evict-b-${Math.random()}`, {
    now: t0 + RATE_LIMIT.windowSeconds * 1000,
  });
  assert.equal(bucketCount(), 1, "only the new window's bucket should remain");
});

test("clientKeyFromHeaders uses the trusted right-most hop, not the client-supplied left-most", () => {
  // "client, proxy" — the left entry is whatever the caller sent, so the key
  // must come from the right-most (proxy-appended) entry.
  const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
  assert.equal(clientKeyFromHeaders(headers), "10.0.0.1");
});

test("a spoofed x-forwarded-for cannot mint a fresh rate-limit bucket", () => {
  // Same real client, different forged left-most entry each request: the derived
  // key must be identical, otherwise the limiter is trivially bypassed (#33).
  const key = () =>
    clientKeyFromHeaders(
      new Headers({
        "x-forwarded-for": `${Math.random()}-spoofed, 198.51.100.9`,
      }),
    );
  assert.equal(key(), "198.51.100.9");
  assert.equal(key(), "198.51.100.9");
});

test("clientKeyFromHeaders prefers the platform-set x-real-ip over forwarded", () => {
  const headers = new Headers({
    "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    "x-real-ip": "198.51.100.9",
  });
  assert.equal(clientKeyFromHeaders(headers), "198.51.100.9");
});

test("clientKeyFromHeaders handles a single forwarded value and blank entries", () => {
  assert.equal(
    clientKeyFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.7" })),
    "203.0.113.7",
  );
  assert.equal(
    clientKeyFromHeaders(new Headers({ "x-forwarded-for": " 203.0.113.7 , " })),
    "203.0.113.7",
  );
});

test("clientKeyFromHeaders falls back to x-real-ip then unknown", () => {
  assert.equal(
    clientKeyFromHeaders(new Headers({ "x-real-ip": "198.51.100.9" })),
    "198.51.100.9",
  );
  assert.equal(clientKeyFromHeaders(new Headers()), "unknown");
});
