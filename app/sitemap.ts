import type { MetadataRoute } from "next";

/**
 * Set APP_URL in the build environment to the domain this build is for,
 * otherwise a staging build will advertise the production URLs.
 */
const BASE_URL = process.env.APP_URL ?? "https://foundryartisancoffee.com";

const ROUTES: {
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/menu", changeFrequency: "daily", priority: 0.9 },
  { path: "/specials", changeFrequency: "daily", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/allergens", changeFrequency: "monthly", priority: 0.6 },
  { path: "/story", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
