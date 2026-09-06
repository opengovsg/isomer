import type { MetadataRoute } from "next"
import config from "@/data/config.json"
import sitemapJson from "@/sitemap.json"
import { getSitemapXml } from "@opengovsg/isomer-components"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  // typing(isomer): fix when types are proper
  // @ts-expect-error to fix when types are proper
  return getSitemapXml(sitemapJson, config.site.url)
}
