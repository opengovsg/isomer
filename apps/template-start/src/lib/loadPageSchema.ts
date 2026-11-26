import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import homepageSchema from "@/schema/_index.json"
import aboutSchema from "@/schema/about.json"
import sitemap from "@/sitemap.json"
import { getSitemapXml } from "@opengovsg/isomer-components"

const SCHEMA_BY_PATH: Record<string, IsomerPageSchemaType> = {
  "/": homepageSchema as IsomerPageSchemaType,
  "/about": aboutSchema as IsomerPageSchemaType,
  "/about/": aboutSchema as IsomerPageSchemaType,
}

export const loadPageSchema = (
  pathname: string,
): IsomerPageSchemaType | null => {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/"
  const schema = SCHEMA_BY_PATH[normalized] ?? SCHEMA_BY_PATH[`${normalized}/`]
  if (!schema) return null

  const joinedPermalink = normalized === "/" ? "" : normalized.slice(1)
  const lastModified =
    getSitemapXml(sitemap).find(
      ({ url }) =>
        joinedPermalink === url.replace(/^\//, "").replace(/\/$/, ""),
    )?.lastModified ?? new Date().toISOString()

  return {
    ...schema,
    page: {
      ...schema.page,
      permalink: normalized === "/" ? "/" : `${normalized}/`,
      lastModified,
    },
  }
}
