import type { MetadataRoute } from "next";

const BASE_URL = process.env.APP_URL ?? "https://foundryartisancoffee.com";

export const dynamic = "force-static";

/**
 * The admin panel is deliberately excluded — there is nothing there for a
 * crawler, and it is behind a sign-in anyway.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/admin/*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
