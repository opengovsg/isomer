import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import { getMetadata, RenderEngine } from "@opengovsg/isomer-components"

export const dynamic = "force-static"

const PAGE_TITLE = "404: Page not found"
const PAGE_DESCRIPTION = "The page that you are accessing does not exist"
const PAGE_SCHEMA_VERSION = "0.1.0"

const timeNow = new Date()
const lastUpdated =
  `${timeNow.getDate().toString().padStart(2, "0")} ` +
  `${timeNow.toLocaleString("default", { month: "short" })} ` +
  `${timeNow.getFullYear()}`

export const generateMetadata = async (
  _props: never,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  // Context for using @/schema/not-found.json
  // For some next15 magical reason, using @/schema/_index.json will cause
  // duplicated generation of the homepage, resulting in wrong meta values
  // Suspected to be due to next15 changing app router SSG to render twice and in async manner
  // During deployment, publisher.sh duplicate homepage "_index.json" to "not-found.json"
  // For development, if `not-found.json` isn't found, simply manually copy and rename
  // SAFETY: publisher-generated not-found schema JSON conforms to IsomerPageSchemaType at build time
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- publisher-generated schema JSON
  const schema = (await import(`@/schema/not-found.json`).then(
    (schemaModule) => schemaModule.default,
  )) as IsomerPageSchemaType
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
  schema.page.permalink = "/404.html"
  schema.page.title = PAGE_TITLE
  schema.meta = {
    ...schema.meta,
    description: PAGE_DESCRIPTION,
  }
  return getMetadata(schema)
}

const NotFound = () => (
  <RenderEngine
    content={[]}
    layout="notfound"
    meta={{
      description: PAGE_DESCRIPTION,
      noIndex: true,
    }}
    page={{
      lastModified: timeNow.toISOString(),
      permalink: "/404.html",
      title: PAGE_TITLE,
    }}
    site={{
      ...config.site,
      assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
      environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
      // typing(isomer): fix when types are proper
      // @ts-expect-error to fix when types are proper
      footerItems: footer,
      navbar,
      // typing(isomer): fix when types are proper
      // @ts-expect-error to fix when types are proper
      siteMap: sitemap,
    }}
    version={PAGE_SCHEMA_VERSION}
  />
)

export default NotFound
