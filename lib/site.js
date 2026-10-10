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
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return new URL(
      configured.startsWith("http") ? configured : `https://${configured}`,
    );
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) {
    return new URL(`https://${vercel}`);
  }

  return new URL("http://localhost:3000");
}
