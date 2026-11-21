// Canonical site origin, used as metadataBase and to build absolute URLs in
// robots.txt and sitemap.xml.
//
// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL — set this for a custom domain.
//   2. VERCEL_PROJECT_PRODUCTION_URL — the stable production domain, provided
//      by Vercel; available at build time.
//   3. localhost — local development.
//
// metadataBase must be a valid absolute URL or the build fails, so a fallback
// is always required.
//
// `metadataBase` is evaluated at module load (app/layout.js), so a malformed
// value would fail the entire production build with an unhelpful stack trace.
// Instead of trusting the raw value, parse it and treat anything that is not a
// valid absolute URL as unset, falling through to the next candidate — the same
// "validate config, else use the documented default" contract the numeric env
// vars follow (lib/env.js). The scheme test is case-insensitive so a value like
// `HTTPS://host` is not blindly re-prefixed into `https://https//host`.
const HAS_HTTP_SCHEME = /^https?:\/\//i;

function parseSiteUrl(raw, name) {
  if (!raw) return null;
  const candidate = HAS_HTTP_SCHEME.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(candidate);
  } catch {
    console.warn(
      `Ignoring invalid ${name}=${JSON.stringify(raw)}; falling back to the default origin.`,
    );
    return null;
  }
}

export function getSiteUrl() {
  return (
    parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL") ||
    parseSiteUrl(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
      "VERCEL_PROJECT_PRODUCTION_URL",
    ) ||
    new URL("http://localhost:3000")
  );
}
