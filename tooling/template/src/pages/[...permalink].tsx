import type {
  IsomerPageSchemaType,
  IsomerSiteProps,
} from "@opengovsg/isomer-components"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import MetadataTags from "@/src/templates/metadata-tags"
import {
  getMetadata,
  getSitemapXml,
  RenderEngine,
  shouldBlockIndexing,
} from "@opengovsg/isomer-components"

const INDEX_PAGE_PERMALINK = "_index"

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

// TODO: Remove casts when sitemap.json sample data has `id` fields required
// by IsomerPageSitemap and footerItems typing is finalized.
const buildSiteProps = () =>
  ({
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    siteMap: sitemap,
    siteMapArray: [],
    navbar,
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  }) as IsomerSiteProps

export const getSchema = async (permalink: string[]) => {
  const joinedPermalink = permalink.join("/")

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const schema = (await import(`@/schema/${joinedPermalink}.json`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    .then((module) => module.default)
    // NOTE: If the initial import is missing this may be an index page
    // with `_index` appended to the original permalink.
    .catch(async () => {
      if (joinedPermalink === "") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return import(`@/schema/${INDEX_PAGE_PERMALINK}.json`).then(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          (module) => module.default,
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return import(
        `@/schema/${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      ).then((module) => module.default)
    })) as IsomerPageSchemaType

  const lastModified =
    getSitemapXml(
      // @ts-ignore to fix when types are proper
      sitemap,
    )
      .find(
        ({ url }) =>
          joinedPermalink === url.replace(/^\//, "").replace(/\/$/, ""),
      )
      ?.lastModified?.toString() ?? new Date().toISOString()

  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified = lastModified

  return schema
}

// Waku's staticPaths for a catch-all route is string[][] where each entry is
// the array of path segments. Exclude the root path ("") — index.tsx handles /.
export const getConfig = () => {
  const paths = getSitemapXml(
    // @ts-ignore to fix when types are proper
    sitemap,
  )
    .map(({ url }) => url.replace(/^\//, "").replace(/\/$/, "").split("/"))
    .filter((segments) => !(segments.length === 1 && segments[0] === ""))

  return {
    render: "static" as const,
    staticPaths: paths,
  }
}

const Page = async ({ permalink }: { permalink: string[] }) => {
  const schema = await getSchema(permalink)
  const siteProps = buildSiteProps()
  schema.site = siteProps

  const metadata = getMetadata(schema)
  const renderMeta = {
    noIndex: shouldBlockIndexing(
      process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    ),
  }

  return (
    <>
      <MetadataTags metadata={metadata} siteName={config.site.siteName} />
      <RenderEngine {...schema} site={siteProps} meta={renderMeta} />
    </>
  )
}

export default Page
