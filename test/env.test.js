import { test } from "node:test";
import assert from "node:assert/strict";
import { positiveIntEnv } from "../lib/env.js";
import { runInFreshProcess } from "../test-helpers/runInFreshProcess.js";

test("positiveIntEnv parses a valid positive integer", () => {
  assert.equal(positiveIntEnv("45", 30, "X"), 45);
  assert.equal(positiveIntEnv(45, 30, "X"), 45);
});

test("positiveIntEnv falls back for unset or empty values", () => {
  assert.equal(positiveIntEnv(undefined, 30, "X"), 30);
  assert.equal(positiveIntEnv(null, 30, "X"), 30);
  assert.equal(positiveIntEnv("", 30, "X"), 30);
});

test("positiveIntEnv refuses non-numeric and non-positive values", () => {
  // "30/min" and "10s" are the realistic typos that previously became NaN.
  assert.equal(positiveIntEnv("30/min", 30, "X"), 30);
  assert.equal(positiveIntEnv("10s", 10000, "X"), 10000);
  assert.equal(positiveIntEnv("abc", 30, "X"), 30);
  assert.equal(positiveIntEnv("0", 30, "X"), 30);
  assert.equal(positiveIntEnv("-5", 30, "X"), 30);
  assert.equal(positiveIntEnv("3.5", 30, "X"), 30);
});

test("a non-numeric RATE_LIMIT_MAX degrades to the default instead of denying all traffic", () => {
  const parsed = runInFreshProcess(
    { RATE_LIMIT_MAX: "abc" },
    `import { RATE_LIMIT, checkRateLimit } from "./lib/rateLimit.js";
     console.log(JSON.stringify({
       maxRequests: RATE_LIMIT.maxRequests,
       allowed: (await checkRateLimit("k")).allowed,
     }));`,
  );
  assert.equal(parsed.maxRequests, 30);
  assert.equal(parsed.allowed, true, "an invalid limit must not deny requests");
});
