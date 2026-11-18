import type {
  IsomerPageSchemaType,
  IsomerSitemap,
} from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import {
  getMetadata,
  getPageJsonLd,
  getSitemapXml,
  RenderEngine,
  shouldBlockIndexing,
} from "@opengovsg/isomer-components"
import { notFound } from "next/navigation"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { serializeForInlineScript } from "@isomer/validators"

export const dynamic = "force-static"

const INDEX_PAGE_PERMALINK = "_index"
const SCHEMA_DIR = join(
  process.cwd(),
  process.env.NODE_ENV === "development" ? ".local-publish/schema" : "schema",
)

const readSchemaFile = (
  relativePath: string,
): IsomerPageSchemaType | undefined => {
  try {
    return JSON.parse(
      readFileSync(join(SCHEMA_DIR, relativePath), "utf8"),
    ) as IsomerPageSchemaType
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return
    throw error
  }
}

interface ParamsContent {
  permalink: string[]
}
interface DynamicPageProps {
  params: Promise<ParamsContent>
}

// Note: permalink should not be able to be undefined
// However, nextjs had some magic props passing going on that causes
// { permalink: [""] } to be converted to {}
// Thus the patch is necessary to convert it back if its undefined
const getPatchedPermalink = async (
  props: DynamicPageProps,
): Promise<ParamsContent["permalink"]> => {
  const params = await props.params
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return params.permalink ?? [""]
}

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

const permalinkKey = (url: string) => url.replace(/^\//, "").replace(/\/$/, "")

const sitemapXml = getSitemapXml(sitemap as IsomerSitemap)
const lastModifiedByPermalink = new Map(
  sitemapXml.map(({ url, lastModified }) => [permalinkKey(url), lastModified]),
)

const getSchema = ({ permalink }: Pick<ParamsContent, "permalink">) => {
  const joinedPermalink: string = permalink.join("/")
  const schema =
    readSchemaFile(`${joinedPermalink}.json`) ??
    readSchemaFile(`${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`)
  if (!schema) notFound()

  const lastModified =
    lastModifiedByPermalink.get(joinedPermalink) || new Date().toISOString()

  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified = lastModified

  return schema
}

export const generateStaticParams = () => {
  return sitemapXml.map(({ url }) => ({
    permalink: permalinkKey(url).split("/"),
  }))
}

export const generateMetadata = async (
  props: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const schema = getSchema({
    permalink: await getPatchedPermalink(props),
  })
  schema.site = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    siteMap: sitemap,
    navbar: navbar,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  }
  return getMetadata(schema)
}

const Page = async (props: DynamicPageProps) => {
  const renderSchema = getSchema({
    permalink: await getPatchedPermalink(props),
  })
  const pageJsonLd = getPageJsonLd({
    ...renderSchema,
    site: {
      siteName: config.site.siteName,
      url: config.site.url,
    },
  })

  return (
    <>
      <RenderEngine
        {...renderSchema}
        site={{
          ...config.site,
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          // TODO: fixup all the typing errors
          // @ts-ignore to fix when types are proper
          siteMap: sitemap,
          navbar: navbar,
          // TODO: fixup all the typing errors
          // @ts-ignore to fix when types are proper
          footerItems: footer,
          lastUpdated,
          assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
        }}
        meta={{
          // TODO: fixup all the typing errors
          noIndex: shouldBlockIndexing(
            process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeForInlineScript(pageJsonLd),
        }}
      />
    </>
  )
}

export default Page
