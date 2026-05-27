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

// Vite statically analyzes this glob at build time, bundling every schema file.
// This avoids dynamic import() with multi-level variable paths, which Rolldown
// (Waku's SSG bundler) rejects with "variables only represent file names one level deep".
const schemaModules = import.meta.glob<{ default: IsomerPageSchemaType }>(
  "/schema/**/*.json",
)

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

  const loadSchema = async (path: string): Promise<IsomerPageSchemaType> => {
    const importFn = schemaModules[path]
    if (!importFn) throw new Error(`Schema not found: ${path}`)
    return (await importFn()).default
  }

  // If the direct path doesn't exist in the glob map, fall back to the _index
  // page for the same path (directory index pages).
  let schemaPath: string
  if (schemaModules[`/schema/${joinedPermalink}.json`]) {
    schemaPath = `/schema/${joinedPermalink}.json`
  } else if (joinedPermalink === "") {
    schemaPath = `/schema/${INDEX_PAGE_PERMALINK}.json`
  } else {
    schemaPath = `/schema/${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`
  }

  const schema = await loadSchema(schemaPath)

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
