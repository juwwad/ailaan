import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function token(name) {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match?.[1];
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Without a rule of its own the page inherits the browser default ring, which
// Chromium renders rgb(16, 16, 16) — about 1:1 on this dark theme, so keyboard
// focus is invisible (#101).
test("the stylesheet defines a visible focus ring", () => {
  const rule = css.match(/:focus-visible\s*\{[^}]*\}/);
  assert.ok(rule, "globals.css must define a :focus-visible rule");
  assert.match(rule[0], /outline:/, "the focus ring must set an outline");
  assert.doesNotMatch(
    rule[0],
    /outline:\s*none/,
    "the focus ring must not be removed",
  );
});

test("the focus ring colour clears WCAG 1.4.11 non-text contrast", () => {
  const ring = css.match(/:focus-visible\s*\{[^}]*\}/)[0];
  const used = ring.match(/var\((--[a-z-]+)\)/)?.[1];
  assert.ok(used, "the focus ring should use a design token, not a literal");

  const ringColor = token(used);
  const page = token("--ink");
  assert.ok(ringColor && page, "both tokens must resolve to a hex colour");

  assert.ok(
    contrast(ringColor, page) >= 3,
    `${used} (${ringColor}) must reach 3:1 against --ink (${page})`,
  );
});
