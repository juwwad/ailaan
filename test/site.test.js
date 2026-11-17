import { test } from "node:test";
import assert from "node:assert/strict";
import { getSiteUrl } from "../lib/site.js";

const SITE_ENV = ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"];

// getSiteUrl reads process.env on each call, so the environment can be swapped
// per test without a fresh process.
function siteUrlFor(env) {
  const previous = SITE_ENV.map((key) => [key, process.env[key]]);
  SITE_ENV.forEach((key) => delete process.env[key]);
  Object.assign(process.env, env);
  try {
    return getSiteUrl().toString();
  } finally {
    SITE_ENV.forEach((key) => delete process.env[key]);
    previous.forEach(([key, value]) => {
      if (value !== undefined) process.env[key] = value;
    });
  }
}

const CASES = [
  ["uses a valid NEXT_PUBLIC_SITE_URL origin", { NEXT_PUBLIC_SITE_URL: "https://ailaan.pk" }, "https://ailaan.pk/"],
  ["adds https:// to a bare hostname", { NEXT_PUBLIC_SITE_URL: "ailaan.pk" }, "https://ailaan.pk/"],
  // A typo here previously failed the whole build with "TypeError: Invalid URL"
  // at module load (app/layout.js) — see #91.
  ["a malformed NEXT_PUBLIC_SITE_URL falls back instead of throwing (#91)", { NEXT_PUBLIC_SITE_URL: "ailaan .pk" }, "http://localhost:3000/"],
  ["an uppercase scheme is not double-prefixed (#91)", { NEXT_PUBLIC_SITE_URL: "HTTPS://Ailaan.pk" }, "https://ailaan.pk/"],
  ["falls back to VERCEL_PROJECT_PRODUCTION_URL", { VERCEL_PROJECT_PRODUCTION_URL: "ailaan.vercel.app" }, "https://ailaan.vercel.app/"],
  ["falls back to localhost when nothing is configured", {}, "http://localhost:3000/"],
];

for (const [name, env, expected] of CASES) {
  test(name, () => assert.equal(siteUrlFor(env), expected));
}
