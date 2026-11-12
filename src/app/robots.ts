import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl=process.env.SITE_URL;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }],
    ...(siteUrl?{sitemap:new URL("/sitemap.xml",siteUrl).toString()}: {})
  };
}
