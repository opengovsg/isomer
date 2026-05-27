import { getSitemapXml } from "@opengovsg/isomer-components"
/**
 * Pre-build script: generates public/sitemap.xml from sitemap.json + data/config.json.
 *
 * Waku has no MetadataRoute.Sitemap convention (unlike Next.js app/sitemap.ts),
 * so we generate the file statically and let Waku serve it from public/.
 *
 * Run via `tsx scripts/generate-sitemap.ts` before `waku build`.
 */
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

import config from "../data/config.json"
import sitemapJson from "../sitemap.json"

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, "..", "public")
mkdirSync(publicDir, { recursive: true })

const entries = getSitemapXml(sitemapJson, config.site.url)

const sitemapXml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map(({ url, lastModified }) => {
    const loc = url.endsWith("/") ? url : `${url}/`
    const date = (lastModified ?? new Date().toISOString()).split("T")[0]
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${date}</lastmod>\n  </url>`
  }),
  `</urlset>`,
].join("\n")

writeFileSync(join(publicDir, "sitemap.xml"), sitemapXml, "utf8")
console.log("✓ public/sitemap.xml written")
