// Parse a numeric environment variable defensively.
//
// `Number(process.env.X || fallback)` turns a typo (e.g. "30/min", "10s") into
// NaN, which then poisons every comparison it feeds: a rate limit becomes "deny
// everything" and a timeout becomes an AbortSignal RangeError. Treat anything
// that is not a positive integer as unset and fall back to the documented
// default, and report the rejection once so the misconfiguration is visible
// instead of silent.
export function positiveIntEnv(raw, fallback, name) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  console.warn(
    `Ignoring invalid ${name}=${JSON.stringify(raw)}; using default ${fallback}.`,
  );
  return fallback;
}
