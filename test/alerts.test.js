import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_DISTRICTS,
  DISTRICT_CONTENT,
  LANGUAGES,
  MAX_READING_AGE_MS,
  NEUTRAL_RISK,
  RISK_META,
  SIMULATED_NOTICE,
  STALE_NOTICE,
  STALE_RISK,
  SUBSCRIBE_COPY,
  UNAVAILABLE_NOTICE,
  UNKNOWN_NOTICE,
  UNKNOWN_RISK,
  alertSpeech,
  buildAlert,
  controlLabel,
  ctaAction,
  dataTier,
  districtName,
  documentLanguage,
  isStale,
  parseStatusResponse,
  presentationTier,
  readingLine,
  riskFromStatus,
  riskPresentation,
  trendLabel,
} from "../lib/alerts.js";
import { DISTRICT_KEYS, DISTRICTS } from "../lib/districts.js";

test("every demo district is a real district, and vice versa", () => {
  assert.deepEqual([...DEMO_DISTRICTS].sort(), [...DISTRICT_KEYS].sort());
});

test("districtName reads from the canonical geo config", () => {
  assert.equal(districtName("nowshera"), DISTRICTS.nowshera.name);
  assert.equal(districtName("mardan"), "Mardan");
});

test("riskFromStatus accepts only known risk keys", () => {
  assert.equal(riskFromStatus({ risk: "high" }), "high");
  assert.equal(riskFromStatus({ risk: "low" }), "low");
  assert.equal(riskFromStatus({ risk: "SEVERE" }), null);
  assert.equal(riskFromStatus({}), null);
  assert.equal(riskFromStatus(null), null);
});

test("dataTier treats anything not explicitly live as simulated", () => {
  assert.equal(dataTier({ source: "google-flood-forecasting" }), "live");
  assert.equal(dataTier({ source: "simulated" }), "simulated");
  assert.equal(dataTier({ source: "something-else" }), "simulated");
  assert.equal(dataTier({}), "simulated");
  assert.equal(dataTier(null), "simulated");
});

test("trendLabel names known trends and passes through unknown ones", () => {
  assert.equal(trendLabel("RISING"), "Rising");
  assert.equal(trendLabel("FALLING"), "Falling");
  assert.equal(trendLabel("WIBBLE"), "WIBBLE");
  assert.equal(trendLabel(null), null);
  // Inherited Object.prototype keys are not trends; they must pass through as
  // the string they are rather than resolve to a native function (#108).
  assert.equal(trendLabel("constructor"), "constructor");
  assert.equal(trendLabel("toString"), "toString");
  assert.equal(
    readingLine({ river: "Kabul River" }, { forecastTrend: "constructor" }, "live"),
    "Kabul River · constructor",
  );
});

test("buildAlert picks the wording for the supplied risk level", () => {
  const high = buildAlert("nowshera", "high");
  assert.match(high.en, /^Urgent/);
  assert.match(high.ps, /Nowshera/);

  const medium = buildAlert("charsadda", "medium");
  assert.match(medium.en, /^Watch/);

  const low = buildAlert("swat", "low");
  assert.match(low.en, /^Calm/);
});

test("active-risk copy never contradicts itself with a no-rise window (#77)", () => {
  // Swat and Mardan once carried the calm-case phrase "no rise expected yet",
  // which the high/medium templates splice after "…will reach knee to waist
  // depth" / "…may flood" — a warning that contradicted itself mid-sentence.
  for (const district of DEMO_DISTRICTS) {
    const window = DISTRICT_CONTENT[district].window;
    assert.doesNotMatch(
      window,
      /no rise expected/i,
      `${district} window must not be a no-rise phrase`,
    );
    assert.match(
      window,
      /\d/,
      `${district} window should name a time frame`,
    );
    for (const risk of ["high", "medium"]) {
      const alert = buildAlert(district, risk);
      for (const lang of ["en", "roman", "ps"]) {
        assert.doesNotMatch(
          alert[lang],
          /no rise expected/i,
          `${district} ${risk} ${lang} must not say "no rise expected"`,
        );
        assert.ok(
          alert[lang].includes(window),
          `${district} ${risk} ${lang} should state the district window`,
        );
      }
    }
  }
});

test("buildAlert never derives a risk level on its own", () => {
  // An unknown/absent risk must produce the explicit unknown wording, never the
  // reassuring "calm" copy (issue #31).
  assert.match(buildAlert("nowshera", null).en, /^Risk unknown/);
  assert.match(buildAlert("nowshera", "unknown").en, /^Risk unknown/);
  assert.doesNotMatch(buildAlert("nowshera", null).en, /^Calm/);
});

test("the unknown-risk message is not reassurance and is present in every language", () => {
  const alert = buildAlert("nowshera", null);
  for (const lang of ["en", "roman", "ps"]) {
    assert.equal(typeof alert[lang], "string");
    assert.ok(alert[lang].length > 0);
  }
  assert.doesNotMatch(alert.en, /no action needed/i);
  assert.match(alert.en, /not.*all-clear/i);
});

test("buildAlert returns null for a district it has no copy for", () => {
  assert.equal(buildAlert("atlantis", "high"), null);
});

test("district lookups do not resolve inherited Object.prototype keys", () => {
  // Plain indexing would read Object.prototype members, so "constructor" would
  // return a name ("Object") and buildAlert would fabricate a warning whose
  // river/landmark are the literal string "undefined" (#87).
  for (const key of ["constructor", "toString", "hasOwnProperty", "valueOf"]) {
    assert.equal(districtName(key), key, `districtName(${key}) must echo the key`);
    assert.equal(buildAlert(key, "high"), null, `buildAlert(${key}) must be null`);
  }
});

test("all Roman-Pashto alert text uses ASCII characters only", () => {
  // Include the unknown-risk branch (riskKey null): it renders UNKNOWN_NOTICE,
  // which is reachable on a live reading with an unrecognised severity (#84).
  for (const district of DEMO_DISTRICTS) {
    for (const risk of ["high", "medium", "low", null]) {
      for (const sample of [false, true]) {
        assert.match(
          buildAlert(district, risk, sample).roman,
          /^[\x00-\x7F]*$/,
          `${district} ${risk} ${sample ? "sample" : "live"} alert should be ASCII`,
        );
      }
    }
  }
});

test("Roman-Pashto UI copy outside buildAlert is ASCII-only", () => {
  for (const [key, copy] of Object.entries(SUBSCRIBE_COPY)) {
    if (key === "ps") continue; // Pashto is Perso-Arabic script, not Roman.
    for (const [field, value] of Object.entries(copy)) {
      assert.match(
        value,
        /^[\x00-\x7F]*$/,
        `SUBSCRIBE_COPY.${key}.${field} should be ASCII`,
      );
    }
  }
  // Every spoken/visible Roman-Pashto string, not just the ones that existed
  // when this test was written: a new notice must not reintroduce a non-ASCII
  // dash (the bug #84 fixes).
  for (const [name, notice] of Object.entries({
    UNKNOWN_NOTICE,
    SIMULATED_NOTICE,
    STALE_NOTICE,
    UNAVAILABLE_NOTICE,
  })) {
    assert.match(notice.roman, /^[\x00-\x7F]*$/, `${name}.roman should be ASCII`);
  }
});

test("sample alerts are prefixed with the spoken caveat in every language", () => {
  for (const lang of ["en", "roman", "ps"]) {
    const sample = buildAlert("nowshera", "high", true);
    const live = buildAlert("nowshera", "high", false);
    assert.ok(
      sample[lang].startsWith(live[lang]) === false,
      "sample text should be prefixed",
    );
    assert.ok(sample[lang].length > live[lang].length);
  }
  assert.match(buildAlert("nowshera", "high", true).en, /not a live warning/i);
});

test("readingLine shows the trend for live data, never a discharge number", () => {
  const content = { river: "Kabul River" };
  assert.equal(
    readingLine(content, { forecastTrend: "RISING", discharge: 452000 }, "live"),
    "Kabul River · Rising",
  );
  // A live body that happens to carry a discharge figure must still not show it.
  assert.doesNotMatch(
    readingLine(content, { forecastTrend: "RISING", discharge: 452000 }, "live"),
    /cusecs/,
  );
});

test("readingLine shows illustrative cusecs for simulated data", () => {
  const content = { river: "Kalpani River" };
  assert.equal(
    readingLine(content, { discharge: 151000 }, "simulated"),
    "Kalpani River · 151,000 cusecs",
  );
});

test("readingLine degrades to just the river when detail is missing", () => {
  assert.equal(readingLine({ river: "Swat River" }, {}, "simulated"), "Swat River");
  assert.equal(readingLine({ river: "Swat River" }, { discharge: 0 }, "simulated"),
    "Swat River · 0 cusecs");
  assert.equal(readingLine(undefined, {}, "live"), "");
});

test("ctaAction replays when a reading is already shown, otherwise loads", () => {
  // A reading on screen: the CTA must re-speak, not silently no-op.
  assert.equal(ctaAction({ status: "ready", hasAlert: true }), "replay");
  // Nothing on screen yet, or still loading/error: arm the load path.
  assert.equal(ctaAction({ status: "idle", hasAlert: false }), "load");
  assert.equal(ctaAction({ status: "loading", hasAlert: false }), "load");
  assert.equal(ctaAction({ status: "error", hasAlert: false }), "load");
  // Ready but no alert object: nothing to speak, so fall back to loading.
  assert.equal(ctaAction({ status: "ready", hasAlert: false }), "load");
  assert.equal(ctaAction(), "load");
});

test("parseStatusResponse keeps a live unknown severity readable (#53)", () => {
  // A successful live fetch whose severity is unrecognised must not be turned
  // into a connectivity failure: the honest unknown-risk copy must render.
  const now = Date.parse("2026-06-01T12:00:00Z");
  const live = {
    district: "nowshera",
    risk: null,
    severity: "SEVERITY_UNKNOWN",
    source: "google-flood-forecasting",
    issuedTime: new Date(now - 60_000).toISOString(),
  };
  const parsed = parseStatusResponse("nowshera", live, now);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.status, "ready");
  assert.equal(parsed.tier, "live");
  assert.equal(parsed.statusBody, live);
  assert.equal(riskFromStatus(parsed.statusBody), null);
  assert.equal(dataTier(parsed.statusBody), "live");
  assert.match(parsed.alert.en, /^Risk unknown/);
  assert.doesNotMatch(parsed.alert.en, /^Calm/);
});

test("isStale treats a missing, unparseable or old timestamp as stale (#74)", () => {
  const now = Date.parse("2026-06-01T12:00:00Z");
  assert.equal(isStale(undefined, now), true);
  assert.equal(isStale(null, now), true);
  assert.equal(isStale("", now), true);
  assert.equal(isStale("not-a-date", now), true);
  assert.equal(isStale(new Date(now - 60_000).toISOString(), now), false);
  assert.equal(
    isStale(new Date(now - MAX_READING_AGE_MS - 1).toISOString(), now),
    true,
  );
});

test("presentationTier separates live, stale and simulated readings (#74)", () => {
  const now = Date.parse("2026-06-01T12:00:00Z");
  const live = {
    source: "google-flood-forecasting",
    issuedTime: new Date(now - 60_000).toISOString(),
  };
  assert.equal(presentationTier(live, now), "live");
  assert.equal(
    presentationTier({ ...live, issuedTime: new Date(now - 8 * 3600_000).toISOString() }, now),
    "stale",
  );
  // A live source with no usable timestamp cannot be trusted as current.
  assert.equal(
    presentationTier({ source: "google-flood-forecasting", issuedTime: null }, now),
    "stale",
  );
  assert.equal(presentationTier({ source: "simulated" }, now), "simulated");
});

test("riskPresentation keeps a stale reading neutral and never a risk colour", () => {
  // Even with a recognised risk key, a stale reading must not show that colour.
  const stale = riskPresentation("stale", "high");
  assert.equal(stale.risk, STALE_RISK);
  assert.equal(stale.iconKey, null);
  assert.notEqual(stale.risk.color, RISK_META.high.color);
});

test("riskPresentation labels simulated risk as a sample and live risk plainly", () => {
  assert.deepEqual(riskPresentation("simulated", "high"), {
    risk: { ...RISK_META.high, label: `Sample: ${RISK_META.high.label}` },
    iconKey: "high",
  });
  assert.deepEqual(riskPresentation("live", "medium"), {
    risk: RISK_META.medium,
    iconKey: "medium",
  });
});

test("riskPresentation is neutral before a reading and unknown once one arrives", () => {
  // tier is null until a reading arrives: nothing has been checked yet.
  assert.deepEqual(riskPresentation(null, null), { risk: NEUTRAL_RISK, iconKey: null });
  // A ready reading with no recognised risk is unknown, never a green all-clear.
  assert.deepEqual(riskPresentation("live", null), { risk: UNKNOWN_RISK, iconKey: null });
});

test("a stale live reading is never spoken or shown as a current warning (#74)", () => {
  const now = Date.parse("2026-06-01T12:00:00Z");
  const stale = {
    district: "nowshera",
    risk: "high",
    severity: "SEVERITY_ALERT",
    source: "google-flood-forecasting",
    issuedTime: new Date(now - 8 * 3600_000).toISOString(),
  };
  const parsed = parseStatusResponse("nowshera", stale, now);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.tier, "stale");
  // The high-risk wording must not be used for an out-of-date reading.
  assert.doesNotMatch(parsed.alert.en, /^Urgent/);
  assert.match(parsed.alert.en, /out of date/i);
  // The reading line must say so too, instead of the trend.
  assert.match(readingLine({ river: "Kabul River" }, stale, "stale"), /out of date/i);
});

test("parseStatusResponse fails safe on an unreadable body", () => {
  // A body we cannot read must not be rendered as a warning.
  assert.deepEqual(parseStatusResponse("nowshera", "nope"), { ok: false });
  assert.deepEqual(parseStatusResponse("nowshera", 42), { ok: false });
  assert.deepEqual(parseStatusResponse("nowshera", { status: null }), { ok: false });
});

test("parseStatusResponse accepts the legacy { status } wrapper", () => {
  const wrapped = { status: { district: "swat", risk: "low", source: "simulated" } };
  const parsed = parseStatusResponse("swat", wrapped);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.statusBody, wrapped.status);
  assert.match(parsed.alert.en, /not a live warning/i);
});

test("each risk level maps to a distinct, presentable colour", () => {
  const colours = Object.values(RISK_META).map((m) => m.color);
  assert.equal(new Set(colours).size, colours.length);
  for (const meta of Object.values(RISK_META)) {
    assert.match(meta.color, /^#[0-9a-f]{6}$/i);
    assert.ok(meta.label.length > 0);
  }
});

test("subscribe copy exists for every UI language and never reuses the English string", () => {
  for (const { key } of LANGUAGES) {
    const copy = SUBSCRIBE_COPY[key];
    assert.ok(copy, `missing SUBSCRIBE_COPY.${key}`);
    for (const field of ["input", "invalid", "submit"]) {
      assert.equal(typeof copy[field], "string");
      assert.ok(copy[field].trim().length > 0, `empty ${key}.${field}`);
    }
  }
  // The phone input's accessible name must be translated, not left as English,
  // otherwise a Pashto screen-reader user hears an unrelated label.
  assert.notEqual(SUBSCRIBE_COPY.ps.input, SUBSCRIBE_COPY.en.input);
  assert.notEqual(SUBSCRIBE_COPY.ps.invalid, SUBSCRIBE_COPY.en.invalid);
});

test("every UI language declares a BCP-47 lang tag", () => {
  for (const { key } of LANGUAGES) {
    const { lang } = documentLanguage(key);
    assert.match(lang, /^[a-z]{2}(-[A-Za-z]+)?$/, `bad lang for ${key}`);
  }
});

test("control accessible names exist for every UI language and are translated (#88)", () => {
  for (const { key } of LANGUAGES) {
    const district = controlLabel(key, "district", "Nowshera");
    const speak = controlLabel(key, "speak");
    assert.ok(district.trim().length > 0, `empty district label for ${key}`);
    assert.ok(speak.trim().length > 0, `empty speak label for ${key}`);
    // The district name must be substituted in, not left as the raw placeholder.
    assert.doesNotMatch(district, /\{name\}/, `${key} left {name} unsubstituted`);
    assert.match(district, /Nowshera/);
  }
  // A screen-reader user in Pashto/Roman must not hear the English string.
  assert.notEqual(controlLabel("ps", "speak"), controlLabel("en", "speak"));
  assert.notEqual(controlLabel("roman", "speak"), controlLabel("en", "speak"));
  assert.notEqual(
    controlLabel("ps", "district", "Swat"),
    controlLabel("en", "district", "Swat"),
  );
});

test("control copy falls back to English for an unknown language", () => {
  assert.equal(controlLabel("fr", "speak"), controlLabel("en", "speak"));
  assert.equal(controlLabel(undefined, "speak"), controlLabel("en", "speak"));
});

test("Roman-Pashto control labels are pure ASCII", () => {
  assert.match(controlLabel("roman", "district", "Mardan"), /^[\x00-\x7F]*$/);
  assert.match(controlLabel("roman", "speak"), /^[\x00-\x7F]*$/);
});

test("documentLanguage reflects the selected language, not always English (#39)", () => {
  assert.deepEqual(documentLanguage("en"), { lang: "en", dir: "ltr" });
  assert.deepEqual(documentLanguage("ps"), { lang: "ps", dir: "rtl" });
  // Roman Pashto is Latin script and reads left-to-right.
  assert.deepEqual(documentLanguage("roman"), { lang: "ps-Latn", dir: "ltr" });
});

test("documentLanguage falls back to English for an unknown language", () => {
  assert.deepEqual(documentLanguage("fr"), { lang: "en", dir: "ltr" });
  assert.deepEqual(documentLanguage(undefined), { lang: "en", dir: "ltr" });
});
