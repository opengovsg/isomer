import type { MetadataRoute } from "next";
import { getSitemapXml } from "@opengovsg/isomer-components";

import sitemapJson from "../sitemap.json";

export default function sitemap(): MetadataRoute.Sitemap {
  // @ts-expect-error type mismatch
  return getSitemapXml(sitemapJson);
}
