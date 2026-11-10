// Client-safe presentation data and pure helpers for the Hero demo.
//
// This module deliberately has no React, DOM or fetch dependency so the alert
// wording and the live/simulated decision can be unit-tested directly (#5).
// It also holds no risk or discharge values: those must come from the API
// response, so the UI can never invent a warning.

import { DISTRICTS as DISTRICT_GEO } from "./districts.js";

// Per-district copy used to compose warnings. `name` is read from the canonical
// geo config so the two definitions cannot drift apart.
export const DISTRICT_CONTENT = {
  nowshera: {
    river: "Kabul River",
    landmark: "the GT Road bypass",
    window: "by Maghrib, around 6pm",
  },
  charsadda: {
    river: "Kabul River",
    landmark: "the Peshawar road ridge",
    window: "within 6 to 12 hours",
  },
  peshawar: {
    river: "Bara River",
    landmark: "the Ring Road overpass",
    window: "within 6 to 12 hours",
  },
  swat: {
    river: "Swat River",
    landmark: "the Mingora ridge road",
    window: "no rise expected yet",
  },
  mardan: {
    river: "Kalpani River",
    landmark: "the Swabi road",
    window: "no rise expected yet",
  },
};

export const DEMO_DISTRICTS = Object.keys(DISTRICT_CONTENT);

export function districtName(key) {
  return DISTRICT_GEO[key]?.name || key;
}

export const RISK_META = {
  high: { color: "#ef4a3d", label: "High risk" },
  medium: { color: "#f2a93b", label: "Medium risk" },
  low: { color: "#35d399", label: "Low risk" },
};

// Shown before any reading exists. Muted and non-alarming on purpose: an
// unloaded district must not borrow a risk colour.
export const NEUTRAL_RISK = { color: "#5b6b7f", label: "Not checked yet" };

// Shown when a live reading arrives but its severity is unrecognised. Neutral,
// never green: an unknown risk must not read as an all-clear.
export const UNKNOWN_RISK = { color: "#5b6b7f", label: "Risk unknown" };

export const LANGUAGES = [
  { key: "en", label: "EN" },
  { key: "roman", label: "Roman" },
  { key: "ps", label: "پښتو", dir: "rtl" },
];

// Accessible names for the WhatsApp subscribe form, per UI language. The phone
// input has no visible <label> (it is a compact pill), so it needs an
// aria-label; without one a screen-reader user hears only "edit text". The
// validation message is announced with role="alert" rather than silently
// dropping the submit, which is invisible to a non-literate user.
export const SUBSCRIBE_COPY = {
  en: {
    input: "WhatsApp number",
    invalid: "Enter a WhatsApp number with at least 10 digits.",
    submit: "Subscribe to flood alerts on WhatsApp",
  },
  roman: {
    input: "WhatsApp number",
    invalid: "Kam az kam 10 hindse lika — da WhatsApp number de.",
    submit: "WhatsApp par flood alert rakhla",
  },
  ps: {
    input: "د واټساپ شمېره",
    invalid: "لږ تر لږه 10 عددونه ولیکئ — دا ستاسو د واټساپ شمېره ده.",
    submit: "د سېلاب خبرداری د واټساپ پر مخ ترلاسه کړئ",
  },
};

// Speech-synthesis locale per UI language. Pashto TTS voices are rare, so `ps`
// falls back to Urdu (`ur-PK`), which shares the Perso-Arabic script and
// pronunciation for most flood vocabulary. Roman Pashto is Latin script, so the
// English voice reads it acceptably.
export function speechLang(langKey) {
  return langKey === "ps" ? "ur-PK" : "en-US";
}

/**
 * Choose the best available voice for `target`. Prefers an exact locale match
 * (e.g. "en-US"), then a same-language match (e.g. "en-GB" for "en-US"), and
 * returns null when nothing matches so the browser default is used.
 */
export function pickVoice(voices, target) {
  if (!Array.isArray(voices) || !target) return null;
  const norm = (value) => (value || "").toLowerCase().replaceAll("_", "-");
  const wanted = norm(target);
  const exact = voices.find((voice) => norm(voice.lang) === wanted);
  if (exact) return exact;
  const base = wanted.split("-")[0];
  return (
    voices.find((voice) => norm(voice.lang).split("-")[0] === base) || null
  );
}

// Spoken and shown whenever data is illustrative. A non-literate user hears
// only this audio, so the caveat has to be part of the warning itself.
export const SIMULATED_NOTICE = {
  en: "Sample demo — not a live warning.",
  roman: "Sample demo - da asli khabardari na da.",
  ps: "بېلګه — دا ریښتینې خبرداری نه دی.",
};

// Shown when a live reading arrives with a severity we do not recognise. It must
// never read as reassurance — the honest message is that the risk is unknown.
export const UNKNOWN_NOTICE = {
  en: `Risk unknown — we could not read a recognised level for this area. Do not treat this as an all-clear; check official channels.`,
  roman: `Khatar maluma na da — da sime level mo wanuway shwa. Da da aaram wali ma zanai; rasmi khabar wasta.`,
  ps: `خطر نامعلوم دی — د دې سیمې کچه مو ونه لوستل شوه. دا د آرامۍ نښه مه ګڼئ؛ رسمي سرچینې وګورئ.`,
};

// Spoken when the warning service could not be reached. A non-literate user
// hears only this audio, so it must say the reading is unavailable AND that it
// is not an all-clear: silence is indistinguishable from "no warning".
export const UNAVAILABLE_NOTICE = {
  en: `We could not reach the warning service, so nothing has been read for this area. This is not an all-clear — check official channels.`,
  roman: `Khabardari service ta rasa na shwa, no da sime khabar na lwastel shwa. Da da aaram nishana na da — rasmi khabar wasta.`,
  ps: `د خبرداری خدمت ته لاسرسی ونه شو، نو د دې سیمې لپاره هېڅ نه دی لوستل شوی. دا د آرامۍ نښه نه ده — رسمي سرچینې وګورئ.`,
};

/**
 * The line to speak for the current view state, or null when there is nothing
 * to say. Extracted so the "unreachable" state speaks an honest warning instead
 * of leaving a non-literate user with silence (#67).
 */
export function alertSpeech(status, alert, lang) {
  if (status === "ready" && alert) return alert[lang] ?? alert.en ?? null;
  if (status === "error") return UNAVAILABLE_NOTICE[lang] ?? UNAVAILABLE_NOTICE.en;
  return null;
}

const TREND_LABELS = {
  RISING: "Rising",
  STEADY: "Steady",
  FALLING: "Falling",
};

export function trendLabel(trend) {
  if (!trend) return null;
  return TREND_LABELS[trend] || trend;
}

/**
 * The single line under the district name. Live readings show the forecast
 * trend (Google exposes no discharge figure); simulated readings keep their
 * illustrative cusecs, which the sample pill above flags as not live.
 */
export function readingLine(content, statusBody, tier) {
  const river = content?.river;
  let detail = null;
  if (tier === "live") {
    detail = trendLabel(statusBody?.forecastTrend);
  } else if (statusBody?.discharge != null) {
    detail = `${statusBody.discharge.toLocaleString()} cusecs`;
  }
  return [river, detail].filter(Boolean).join(" · ");
}

/** Valid risk key from a status body, or null when absent/unrecognised. */
export function riskFromStatus(status) {
  const risk = status?.risk;
  return Object.hasOwn(RISK_META, risk) ? risk : null;
}

/**
 * Whether a response is live or illustrative. Anything unrecognised is treated
 * as simulated: an unknown source must never be presented as a live warning.
 */
export function dataTier(status) {
  return status?.source === "google-flood-forecasting" ? "live" : "simulated";
}

/**
 * What the headline CTA should do for the current view state. `replay` when a
 * reading is already on screen — pressing the button must always produce audio
 * for non-literate users, so it cannot route through the load path, which is a
 * no-op once the district is current. `load` otherwise (arms speak-on-arrival).
 */
export function ctaAction({ status, hasAlert } = {}) {
  return status === "ready" && hasAlert ? "replay" : "load";
}

/**
 * Interpret a `/api/flood-status` response body into the demo's view state.
 *
 * Two cases must not be conflated (#53):
 *  - a body we cannot read at all (not an object) -> `{ ok: false }`, so the UI
 *    shows the "unreachable" state rather than a fabricated warning;
 *  - a readable body whose severity we do not recognise -> `{ ok: true }` with a
 *    null risk, which renders the honest "risk unknown" state — never simulated
 *    and never an all-clear.
 *
 * Accepts both the flat route shape and the legacy `{ status }` wrapper.
 */
export function parseStatusResponse(districtKey, responseData) {
  const body = Object.hasOwn(responseData ?? {}, "risk")
    ? responseData
    : responseData?.status;
  if (typeof body !== "object" || body === null) return { ok: false };
  return {
    ok: true,
    status: "ready",
    alert: buildAlert(
      districtKey,
      riskFromStatus(body),
      dataTier(body) === "simulated",
    ),
    statusBody: body,
  };
}

export function buildAlert(districtKey, riskKey, sample = false) {
  const content = DISTRICT_CONTENT[districtKey];
  if (!content) return null;

  const d = {
    name: districtName(districtKey),
    river: content.river,
    landmark: content.landmark,
    window: content.window,
  };

  let base;
  if (riskKey === "high") {
    base = {
      en: `Urgent — ${d.name}: the ${d.river} is rising fast. Water will reach knee to waist depth ${d.window}. Move your family and animals to ${d.landmark} now.`,
      roman: `${d.name} ta khatarnak khabardari: ${d.river} dera ghrandai loredzi. Obah ${d.window} kamar-jag lware wi. Khpal koranai aw tsarwi ${d.landmark} ta osa olegday.`,
      ps: `${d.name} ته خطرناک خبرداری: ${d.river} ډېره ګړندۍ لوړېږي. اوبه به ${d.window} د زنګون تر کمر پورې لوړې وي. خپل کورنۍ او څاروي اوس مهال ${d.landmark} ته ولیږدئ.`,
    };
  } else if (riskKey === "medium") {
    base = {
      en: `Watch — ${d.name}: the ${d.river} is rising. Low-lying streets may flood ${d.window}. Keep essentials packed and stay near ${d.landmark}.`,
      roman: `${d.name} lapara khabardari: ${d.river} lwaregi. Teto sarakuna ${d.window} tar obo lande kedai shi. Zaroori shai chmatawali wasata.`,
      ps: `${d.name} لپاره خبرداری: ${d.river} لوړېږي. ټیټې سړکونه ${d.window} تر اوبو لاندې کېدای شي. اړین توکي چمتو وساتئ.`,
    };
  } else if (riskKey === "low") {
    base = {
      en: `Calm — ${d.name}: the ${d.river} is steady today. Risk is low, no action needed. We are still watching for you.`,
      roman: `${d.name} nan aaram day: ${d.river} sam dy. Khatar kam dy, os hits kar pakar na dy. Mung ba mudam goro.`,
      ps: `${d.name} نن آرام دی: ${d.river} ثابت دی. خطر کم دی، اوس هېڅ کار پکار نه دی. موږ به مو تعقیب کوو.`,
    };
  } else {
    // Unknown/absent risk must never fall back to the reassuring "calm" copy.
    base = UNKNOWN_NOTICE;
  }

  if (!sample) return base;
  return {
    en: `${SIMULATED_NOTICE.en} ${base.en}`,
    roman: `${SIMULATED_NOTICE.roman} ${base.roman}`,
    ps: `${SIMULATED_NOTICE.ps} ${base.ps}`,
  };
}
