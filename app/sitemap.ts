import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return ["/", "/early-access", "/privacy"].map((path) => ({
    url: base + path,
    lastModified: new Date("2026-10-14"),
  }));
}
