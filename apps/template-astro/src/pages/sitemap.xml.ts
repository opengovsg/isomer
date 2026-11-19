import { getSitemapXml } from "@opengovsg/isomer-components"

import { config, sitemap } from "../lib/site"

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Same entries and markup as apps/template/app/sitemap.ts (Next's MetadataRoute.Sitemap).
export const GET = () => {
  const urls = getSitemapXml(sitemap, config.site.url)
    .map(
      ({ url, lastModified }) =>
        `<url>\n<loc>${esc(url)}</loc>\n${lastModified ? `<lastmod>${esc(lastModified)}</lastmod>\n` : ""}</url>`,
    )
    .join("\n")
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  )
}
