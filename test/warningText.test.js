import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hero = readFileSync(new URL("../components/Hero.js", import.meta.url), "utf8");

// The ready-state alert can be five lines at 360 px wide (the narrowest width
// the layout supports), and its last line carries the evacuation instruction.
// A line clamp hides that line with no scrollbar, so the warning text must
// render at full height (#106).
test("the ready-state warning text is not line-clamped (#106)", () => {
  const start = hero.indexOf('{demo.status === "ready" && (');
  assert.ok(start !== -1, "expected the ready-state alert block in Hero.js");
  const span = hero.slice(start).match(/<span className="([^"]*)"/);
  assert.ok(span, "expected the ready-state alert span");
  const classes = span[1].split(/\s+/);
  assert.ok(
    !classes.some((name) => name.startsWith("line-clamp")),
    `the warning text must not be clamped, got: ${span[1]}`,
  );
});
