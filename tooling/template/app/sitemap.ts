import type { MetadataRoute } from "next";
import { getSitemapXml } from "@opengovsg/isomer-components";

import sitemapJson from "../sitemap.json";

export default function sitemap(): MetadataRoute.Sitemap {
  // @ts-ignore blah
  return getSitemapXml(sitemapJson);
}
