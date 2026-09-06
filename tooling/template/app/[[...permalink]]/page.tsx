import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
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

import { serializeForInlineScript } from "@isomer/validators"

export const dynamic = "force-static"

const INDEX_PAGE_PERMALINK = "_index"

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
  `${timeNow.getDate().toString().padStart(2, "0")} ` +
  `${timeNow.toLocaleString("default", { month: "short" })} ` +
  `${timeNow.getFullYear()}`

const loadSchemaJson = async (schemaPath: string) => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment -- dynamic JSON schema imports are untyped at build time
  const schemaModule = await import(`@/schema/${schemaPath}.json`)
  // oxlint-disable-next-line typescript/no-unsafe-member-access, typescript/no-unsafe-return -- publisher-generated schema JSON
  return schemaModule.default
}

const getSchema = async ({ permalink }: Pick<ParamsContent, "permalink">) => {
  const joinedPermalink = permalink.join("/")

  const fallbackPath =
    joinedPermalink === ""
      ? INDEX_PAGE_PERMALINK
      : `${joinedPermalink}/${INDEX_PAGE_PERMALINK}`

  let schemaJson
  try {
    // oxlint-disable-next-line typescript/no-unsafe-assignment -- publisher-generated schema JSON
    schemaJson = await loadSchemaJson(joinedPermalink)
  } catch {
    // oxlint-disable-next-line typescript/no-unsafe-assignment -- publisher-generated schema JSON
    schemaJson = await loadSchemaJson(fallbackPath)
  }

  // SAFETY: publisher-generated schema JSON files conform to IsomerPageSchemaType at build time
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- publisher-generated schema JSON
  const schema = schemaJson as IsomerPageSchemaType

  const lastModified =
    // typing(isomer): fix when types are proper
    // @ts-expect-error to fix when types are proper
    getSitemapXml(sitemap).find(
      ({ url }) =>
        joinedPermalink === url.replace(/^\//u, "").replace(/\/$/u, ""),
    ).lastModified || new Date().toISOString()

  schema.page.permalink = `/${joinedPermalink}`
  schema.page.lastModified = lastModified

  return schema
}

export const generateStaticParams = () =>
  // typing(isomer): fix when types are proper
  // @ts-expect-error to fix when types are proper
  getSitemapXml(sitemap).map(({ url }) => ({
    permalink: url.replace(/^\//u, "").replace(/\/$/u, "").split("/"),
  }))

export const generateMetadata = async (
  props: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const schema = await getSchema({
    permalink: await getPatchedPermalink(props),
  })
  schema.site = {
    ...config.site,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // typing(isomer): fix when types are proper
    // @ts-expect-error to fix when types are proper
    footerItems: footer,
    lastUpdated,
    navbar,
    // typing(isomer): fix when types are proper
    // @ts-expect-error to fix when types are proper
    siteMap: sitemap,
  }
  return getMetadata(schema)
}

const Page = async (props: DynamicPageProps) => {
  const renderSchema = await getSchema({
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
        meta={{
          // typing(isomer): fix when types are proper
          noIndex: shouldBlockIndexing(
            process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          ),
        }}
        site={{
          ...config.site,
          assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          // typing(isomer): fix when types are proper
          // @ts-expect-error to fix when types are proper
          footerItems: footer,
          lastUpdated,
          navbar,
          // typing(isomer): fix when types are proper
          // @ts-expect-error to fix when types are proper
          siteMap: sitemap,
        }}
      />
      <script
        type="application/ld+json"
        // oxlint-disable-next-line react/no-danger -- JSON-LD is serialized via serializeForInlineScript
        dangerouslySetInnerHTML={{
          __html: serializeForInlineScript(pageJsonLd),
        }}
      />
    </>
  )
}

export default Page
