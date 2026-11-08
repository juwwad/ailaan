import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
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

// rateLimit.js reads TRUSTED_PROXY_HOPS at import time, so exercise the parsed
// value in a fresh process with a deliberately invalid / oversized setting.
function runInFreshProcess(env, script) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  return JSON.parse(out.trim().split("\n").pop());
}

test("a non-numeric TRUSTED_PROXY_HOPS degrades to the default instead of collapsing every client into one bucket", () => {
  // Two different clients must not share a key when the value is garbage (#62).
  const parsed = runInFreshProcess(
    { TRUSTED_PROXY_HOPS: "abc" },
    `import { clientKeyFromHeaders } from "./lib/rateLimit.js";
     const key = (ip) =>
       clientKeyFromHeaders(new Headers({ "x-forwarded-for": ip }));
     console.log(JSON.stringify({ a: key("1.1.1.1"), b: key("9.9.9.9") }));`,
  );
  assert.notEqual(parsed.a, undefined);
  assert.notEqual(parsed.a, parsed.b, "distinct clients must not share a bucket");
});

test("a chain shorter than TRUSTED_PROXY_HOPS is not keyed on the spoofable left-most entry", () => {
  // A hop count larger than the chain would, under the old Math.max(0, ...) index,
  // select the client-supplied left-most entry and re-open spoofing (#33, #62).
  // Such a request did not arrive through the expected proxies, so key it
  // "unknown" instead of trusting any value in the header.
  const parsed = runInFreshProcess(
    { TRUSTED_PROXY_HOPS: "3" },
    `import { clientKeyFromHeaders } from "./lib/rateLimit.js";
     console.log(JSON.stringify({
       tooShort: clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" })),
       exact: clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1, 10.0.0.2" })),
     }));`,
  );
  assert.equal(parsed.tooShort, "unknown");
  // With three trusted hops the client is the third entry from the end.
  assert.equal(parsed.exact, "1.1.1.1");
});

test("the default single trusted hop still keys on the right-most forwarded entry", () => {
  // Guards against the fix changing the documented default behaviour: with one
  // trusted proxy the right-most entry is the client.
  const parsed = runInFreshProcess(
    {},
    `import { clientKeyFromHeaders } from "./lib/rateLimit.js";
     console.log(JSON.stringify({
       key: clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" })),
     }));`,
  );
  assert.equal(parsed.key, "10.0.0.1");
});
