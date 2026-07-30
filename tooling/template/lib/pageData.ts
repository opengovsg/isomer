import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import {
  getMetadata,
  getSitemapXml,
  shouldBlockIndexing,
} from "@opengovsg/isomer-components/engine/metadata"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

export const INDEX_PAGE_PERMALINK = "_index"

const timeNow = new Date()
export const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

export const buildSiteProps = (): IsomerPageSchemaType["site"] =>
  ({
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    siteMap: sitemap,
    // Fixture/sitemap.json is not a fully typed IsomerSitemap (missing ids etc.)
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-argument
    siteMapArray: getSitemapAsArray(sitemap as never),
    navbar,
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  }) as IsomerPageSchemaType["site"]

export const buildMeta = (noIndex?: boolean) => ({
  noIndex:
    noIndex ??
    shouldBlockIndexing(process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT),
})

export const getSchemaForPermalink = async (
  permalinkSegments: string[],
): Promise<IsomerPageSchemaType> => {
  const joinedPermalink = permalinkSegments.join("/")

  const schema = (await import(`@/schema/${joinedPermalink}.json`)
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    .then((module) => module.default)
    .catch(async () => {
      if (joinedPermalink === "") {
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
        return import(`@/schema/${INDEX_PAGE_PERMALINK}.json`).then(
          // oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          (module) => module.default,
        )
      }
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
      return import(
        `@/schema/${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      ).then((module) => module.default)
    })) as IsomerPageSchemaType

  const lastModified =
    // TODO: fixup all the typing errors
    // @ts-expect-error to fix when types are proper
    getSitemapXml(sitemap).find(
      ({ url }: { url: string }) =>
        joinedPermalink === url.replace(/^\//, "").replace(/\/$/, ""),
    )?.lastModified || new Date().toISOString()

  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified = lastModified

  return schema
}

export { getMetadata, getSitemapXml, shouldBlockIndexing, sitemap }
