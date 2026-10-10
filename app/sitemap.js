import { getSiteUrl } from "@/lib/site";

export default function sitemap() {
  return [
    {
      url: getSiteUrl().toString(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
