import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl=process.env.SITE_URL;
  if(!siteUrl)return [];
  const pages=["/","/account/","/methodology/","/privacy/","/risk-disclosure/"];
  return pages.map(path=>({
    url:new URL(path,siteUrl).toString(),
    changeFrequency:path==="/"? "daily":"monthly",
    priority:path==="/"?1:0.4
  }));
}
