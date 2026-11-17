import { test } from "node:test";
import assert from "node:assert/strict";
import { getSiteUrl } from "../lib/site.js";

// getSiteUrl reads process.env on each call, so the environment can be swapped
// per test without a fresh process.
function withEnv(env, fn) {
  const previous = { ...process.env };
  for (const key of ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  try {
    return fn();
  } finally {
    for (const key of ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"]) {
      delete process.env[key];
    }
    Object.assign(process.env, previous);
  }
}

test("uses NEXT_PUBLIC_SITE_URL when it is a valid origin", () => {
  withEnv({ NEXT_PUBLIC_SITE_URL: "https://ailaan.pk" }, () => {
    assert.equal(getSiteUrl().toString(), "https://ailaan.pk/");
  });
});

test("adds https:// to a bare hostname", () => {
  withEnv({ NEXT_PUBLIC_SITE_URL: "ailaan.pk" }, () => {
    assert.equal(getSiteUrl().toString(), "https://ailaan.pk/");
  });
});

test("a malformed NEXT_PUBLIC_SITE_URL falls back instead of throwing (#91)", () => {
  // A typo in this deployer-set variable previously failed the whole build with
  // "TypeError: Invalid URL" at module load (app/layout.js).
  withEnv({ NEXT_PUBLIC_SITE_URL: "ailaan .pk" }, () => {
    assert.equal(getSiteUrl().toString(), "http://localhost:3000/");
  });
});

test("an uppercase scheme is not double-prefixed (#91)", () => {
  withEnv({ NEXT_PUBLIC_SITE_URL: "HTTPS://Ailaan.pk" }, () => {
    assert.equal(getSiteUrl().toString(), "https://ailaan.pk/");
  });
});

test("falls back to VERCEL_PROJECT_PRODUCTION_URL when NEXT_PUBLIC_SITE_URL is unset", () => {
  withEnv({ VERCEL_PROJECT_PRODUCTION_URL: "ailaan.vercel.app" }, () => {
    assert.equal(getSiteUrl().toString(), "https://ailaan.vercel.app/");
  });
});

test("falls back to localhost when nothing is configured", () => {
  withEnv({}, () => {
    assert.equal(getSiteUrl().toString(), "http://localhost:3000/");
  });
});
