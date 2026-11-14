import { test } from "node:test";
import assert from "node:assert/strict";

// next.config.mjs reads NODE_ENV at import time, so each test imports a fresh
// copy with a cache-busting query after setting NODE_ENV.
async function loadHeaders(nodeEnv) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  try {
    const mod = await import(`../next.config.mjs?env=${nodeEnv}-${Math.random()}`);
    const [{ headers }] = await mod.default.headers();
    return Object.fromEntries(headers.map((h) => [h.key, h.value]));
  } finally {
    process.env.NODE_ENV = previous;
  }
}

test("the framework fingerprint header is disabled", async () => {
  // X-Powered-By: Next.js is on by default; the hardening suite should not
  // leave the framework version advertised on every page and API response.
  const mod = await import(`../next.config.mjs?env=powered-by-${Math.random()}`);
  assert.equal(mod.default.poweredByHeader, false);
});

test("sets the standard hardening headers on every path", async () => {
  const headers = await loadHeaders("production");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(
    headers["Referrer-Policy"],
    "strict-origin-when-cross-origin",
  );
  assert.ok(headers["Content-Security-Policy"].includes("frame-ancestors 'none'"));
  assert.ok(headers["Permissions-Policy"].includes("camera=()"));
});

test("CSP locks sources to self and allows the inline styles/scripts Next emits", async () => {
  const { "Content-Security-Policy": csp } = await loadHeaders("production");
  assert.ok(csp.includes("default-src 'self'"));
  assert.ok(csp.includes("object-src 'none'"));
  assert.ok(csp.includes("base-uri 'self'"));
  assert.ok(csp.includes("form-action 'self'"));
  assert.ok(csp.includes("script-src 'self' 'unsafe-inline'"));
  assert.ok(csp.includes("style-src 'self' 'unsafe-inline'"));
  // Production must not open the door to eval.
  assert.ok(!csp.includes("'unsafe-eval'"));
});

test("CSP permits unsafe-eval only outside production", async () => {
  const { "Content-Security-Policy": csp } = await loadHeaders("development");
  assert.ok(csp.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval'"));
});

test("HSTS is sent in production and omitted elsewhere", async () => {
  const prod = await loadHeaders("production");
  assert.match(
    prod["Strict-Transport-Security"],
    /max-age=\d+; includeSubDomains; preload/,
  );

  const dev = await loadHeaders("development");
  assert.equal(dev["Strict-Transport-Security"], undefined);
});
