import type { MetadataRoute } from "next"
import sitemapJson from "@/sitemap.json"
import { getSitemapXml } from "@opengovsg/isomer-components"

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: fixup all the typing errors
  // @ts-expect-error to fix when types are proper
  return getSitemapXml(sitemapJson)
}
