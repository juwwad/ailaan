import { test } from "node:test";
import assert from "node:assert/strict";
import {
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

test("clientKeyFromHeaders extracts the first forwarded IP", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
  assert.equal(clientKeyFromHeaders(headers), "203.0.113.7");
});

test("clientKeyFromHeaders falls back to x-real-ip then unknown", () => {
  assert.equal(
    clientKeyFromHeaders(new Headers({ "x-real-ip": "198.51.100.9" })),
    "198.51.100.9",
  );
  assert.equal(clientKeyFromHeaders(new Headers()), "unknown");
});
