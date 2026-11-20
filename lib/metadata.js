import { getSiteUrl } from "./site.js";

// Root metadata, kept in a plain module (no React/font/CSS imports) so the head
// tags can be unit-tested directly. `app/layout.js` renders it via Next's
// `metadata` export.

export const SITE_TITLE = "Ailaan — Flood Alerts for Khyber Pakhtunkhwa";
export const SITE_DESCRIPTION =
  "Ailaan turns satellite flood data into spoken warnings in Pashto, Roman Pashto and English — built for communities, not control rooms.";

export function siteMetadata() {
  return {
    metadataBase: getSiteUrl(),
    // One canonical URL for the single-page app. The site is reachable on
    // several hostnames (custom domain, per-deployment and *.vercel.app URLs,
    // localhost), so without this a crawler could index each one separately.
    alternates: { canonical: "/" },
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: "Ailaan",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: "/",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}
