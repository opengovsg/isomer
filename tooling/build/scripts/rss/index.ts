import type {
  IsomerCollectionPageSitemap,
  IsomerSiteProps,
  IsomerSitemap,
} from "@opengovsg/isomer-components"
import { getSitemapAsArray } from "@opengovsg/isomer-components/build-utils"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"

import { buildFeedXml } from "./generateRss"

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

interface SiteConfigFile {
  site: Omit<IsomerSiteProps, "siteMap" | "siteMapArray">
}

const main = (): void => {
  const sitemapPath = requireEnv("SITEMAP_JSON")
  const configPath = requireEnv("CONFIG_JSON")
  const outDir = requireEnv("OUT_DIR")

  const sitemap = JSON.parse(
    readFileSync(sitemapPath, "utf-8"),
  ) as IsomerSitemap
  const config = JSON.parse(readFileSync(configPath, "utf-8")) as SiteConfigFile

  const site = {
    ...config.site,
    siteMap: sitemap,
    siteMapArray: getSitemapAsArray(sitemap),
    // assetsBaseUrl is injected at build time (see tooling/template/app), not
    // stored in config.json; it is what resolves uploaded-file links to the CDN.
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  } as unknown as IsomerSiteProps

  const collections = getSitemapAsArray(sitemap).filter(
    (node): node is IsomerCollectionPageSitemap => node.layout === "collection",
  )

  const buildDate = new Date()
  for (const collectionNode of collections) {
    const xml = buildFeedXml({ site, collectionNode, buildDate })
    const feedPath = join(outDir, collectionNode.permalink, "rss.xml")
    mkdirSync(dirname(feedPath), { recursive: true })
    writeFileSync(feedPath, xml, "utf-8")
    console.log(`Wrote ${feedPath}`)
  }

  console.log(`Generated ${collections.length} RSS feed(s).`)
}

main()
