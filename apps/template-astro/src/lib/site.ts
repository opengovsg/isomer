import type {
  IsomerPageSchemaType,
  IsomerSitemap,
} from "@opengovsg/isomer-components"
import { getSitemapXml } from "@opengovsg/isomer-components"
import fs from "node:fs"
import path from "node:path"

// Reads apps/template's data/, schema/ and sitemap.json (where the publisher writes them).
const SITE_DIR = path.resolve(process.cwd(), "../template")
const INDEX_PAGE_PERMALINK = "_index"

const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(SITE_DIR, file), "utf8")) as T

export const config = readJson<{
  site: Record<string, unknown> & { siteName: string; url: string }
  colors: Record<string, unknown>
}>("data/config.json")
export const navbar = readJson<unknown>("data/navbar.json")
export const footer = readJson<Record<string, unknown>>("data/footer.json")
export const sitemap = readJson<IsomerSitemap>("sitemap.json")

const timeNow = new Date()
export const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

export const environment = process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT
export const assetsBaseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL

export const siteProps = {
  ...config.site,
  environment,
  siteMap: sitemap,
  navbar,
  footerItems: footer,
  lastUpdated,
  assetsBaseUrl,
}

const sitemapEntries = getSitemapXml(sitemap).map(({ url, lastModified }) => ({
  permalink: url.replace(/^\//, "").replace(/\/$/, ""),
  lastModified,
}))

export const getPermalinks = () => sitemapEntries.map((e) => e.permalink)

// Mirrors apps/template's getSchema: `a/b.json`, then `a/b/_index.json` (or `_index.json` for /).
export const getSchema = (joinedPermalink: string): IsomerPageSchemaType => {
  const candidates =
    joinedPermalink === ""
      ? [`${INDEX_PAGE_PERMALINK}.json`]
      : [
          `${joinedPermalink}.json`,
          `${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`,
        ]
  const file = candidates.find((c) =>
    fs.existsSync(path.join(SITE_DIR, "schema", c)),
  )
  if (!file) throw new Error(`No schema for permalink "/${joinedPermalink}"`)

  const schema = readJson<IsomerPageSchemaType>(`schema/${file}`)
  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified =
    sitemapEntries.find((e) => e.permalink === joinedPermalink)?.lastModified ??
    new Date().toISOString()
  return schema
}
