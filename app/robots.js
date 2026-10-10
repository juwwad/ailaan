import { getSiteUrl } from "@/lib/site";

export default function robots() {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The API proxies a quota-metered upstream and should not be crawled.
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
