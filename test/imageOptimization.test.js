import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);

// Next.js lists `sharp` only as an *optional* dependency. If it is absent (e.g.
// installed with --omit=optional, or a platform binary that failed to build),
// Next silently serves unoptimized images. Declaring it directly and asserting
// it here turns that silent downgrade into a CI failure (#37).
test("sharp is a declared dependency, not an implicit optional one", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.ok(
    pkg.dependencies?.sharp,
    "sharp must be listed in dependencies so image optimization is not implicit",
  );
});

test("sharp resolves at runtime, so image optimization is active", () => {
  const sharp = require("sharp");
  assert.equal(typeof sharp, "function");
});
