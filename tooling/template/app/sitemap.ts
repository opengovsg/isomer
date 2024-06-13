import sitemapJson from "@/sitemap.json";
import { getSitemapXml } from "@opengovsg/isomer-components";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // @ts-expect-error blah
  return getSitemapXml(sitemapJson);
}
