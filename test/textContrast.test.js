import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hero = readFileSync(new URL("../components/Hero.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function hex(name) {
  return css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
}

function luminance(value) {
  const channels = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// `text-mist/NN` paints --mist at NN% over the surface behind it. The muted
// helper text sits on the glass card, so the card colour is the surface that
// decides AA compliance. Below 55% the result drops under 4.5:1 there (#100).
const MIN_ALPHA = 55;

function composite(foreground, background, alpha) {
  const mix = (offset) =>
    Math.round(
      parseInt(foreground.slice(offset, offset + 2), 16) * alpha +
        parseInt(background.slice(offset, offset + 2), 16) * (1 - alpha),
    );
  return `#${[1, 3, 5]
    .map((offset) => mix(offset).toString(16).padStart(2, "0"))
    .join("")}`;
}

test("muted text classes stay above the WCAG AA contrast floor", () => {
  const alphas = [...hero.matchAll(/text-mist\/(\d+)/g)].map((m) => Number(m[1]));
  assert.ok(alphas.length > 0, "expected muted text classes in Hero.js");

  const mist = hex("--mist");
  const ink = hex("--ink");
  // The glass demo card is bg-white/[0.07] over --ink.
  const card = composite("#ffffff", ink, 0.07);

  for (const alpha of alphas) {
    assert.ok(
      alpha >= MIN_ALPHA,
      `text-mist/${alpha} is below the ${MIN_ALPHA}% floor`,
    );
    const rendered = composite(mist, card, alpha / 100);
    assert.ok(
      ratio(rendered, card) >= 4.5,
      `text-mist/${alpha} renders at ${ratio(rendered, card).toFixed(2)}:1 on the card, under 4.5:1`,
    );
  }
});
