import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

function publicImage(name) {
  return fileURLToPath(new URL(`../public/${name}`, import.meta.url));
}

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

// The logo is rendered at 28-36px, so a multi-megapixel source only makes
// `sharp` decode a huge buffer before downscaling it (#112).
test("the logo is not shipped at a wildly oversized resolution (#112)", async () => {
  const sharp = require("sharp");
  const { width, height } = await sharp(publicImage("logo.webp")).metadata();
  assert.ok(
    width <= 512 && height <= 512,
    `public/logo.webp is ${width}x${height}; keep it <= 512 for a 36px slot`,
  );
});
