import assert from "node:assert/strict";
import test from "node:test";

import {
  RATE_LIMIT_NOTICE,
  UNAVAILABLE_NOTICE,
  alertSpeech,
} from "../lib/alerts.js";

const LANGS = ["en", "roman", "ps"];

test("a throttled request does not borrow the outage copy (#120)", () => {
  for (const lang of LANGS) {
    const spoken = alertSpeech("rate-limited", null, lang);
    assert.equal(spoken, RATE_LIMIT_NOTICE[lang]);
    assert.notEqual(spoken, UNAVAILABLE_NOTICE[lang]);
    assert.doesNotMatch(spoken, /could not reach|reach the warning service/i);
  }
});

test("every UI language defines a rate-limit notice", () => {
  for (const lang of LANGS) {
    assert.ok(RATE_LIMIT_NOTICE[lang], `missing ${lang}`);
    assert.ok(RATE_LIMIT_NOTICE[lang].trim().length > 0, `empty ${lang}`);
  }
});

test("the rate-limit notice still refuses to read as an all-clear", () => {
  assert.match(RATE_LIMIT_NOTICE.en, /not an all-clear/i);
  assert.match(RATE_LIMIT_NOTICE.roman, /aaram nishana na da/i);
  assert.match(RATE_LIMIT_NOTICE.ps, /آرامۍ/);
});

test("Roman Pashto stays ASCII", () => {
  // The Roman voice is an English voice, so non-ASCII characters are either
  // skipped or mispronounced as nothing.
  assert.match(RATE_LIMIT_NOTICE.roman, /^[\x20-\x7E]*$/);
});

test("an unknown language falls back to English rather than silence", () => {
  assert.equal(alertSpeech("rate-limited", null, "xx"), RATE_LIMIT_NOTICE.en);
});

test("idle state stays silent so the play button is not enabled early", () => {
  assert.equal(alertSpeech("idle", null, "en"), null);
  assert.equal(alertSpeech("loading", null, "en"), null);
});
