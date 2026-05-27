import type {
  IsomerPageSchemaType,
  IsomerSiteProps,
} from "@opengovsg/isomer-components"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import MetadataTags from "@/src/templates/metadata-tags"
import { getMetadata, RenderEngine } from "@opengovsg/isomer-components"

const PAGE_TITLE = "404: Page not found"
const PAGE_DESCRIPTION = "The page that you are accessing does not exist"

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

export const getConfig = () => ({
  render: "static" as const,
})

const NotFound = async () => {
  // Context for using @/schema/not-found.json:
  // During deployment, publisher.sh duplicates homepage "_index.json" to
  // "not-found.json". For local dev, copy and rename _index.json manually
  // if not-found.json is missing.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const schema = (await import(`@/schema/not-found.json`).then(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    (module) => module.default,
  )) as IsomerPageSchemaType

  // TODO: Remove casts when sitemap.json sample data has `id` fields required
  // by IsomerPageSitemap and footerItems typing is finalized.
  const siteProps = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    siteMap: sitemap,
    siteMapArray: [],
    navbar,
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  } as IsomerSiteProps

  schema.site = siteProps
  schema.page.permalink = "/404.html"
  schema.page.title = PAGE_TITLE
  schema.meta = { ...schema.meta, description: PAGE_DESCRIPTION }

  const metadata = getMetadata(schema)

  const renderProps: Extract<IsomerPageSchemaType, { layout: "notfound" }> = {
    site: siteProps,
    layout: "notfound",
    meta: { noIndex: true, description: PAGE_DESCRIPTION },
    page: {
      title: PAGE_TITLE,
      permalink: "/404.html",
      lastModified: new Date().toISOString(),
    },
  }

  return (
    <>
      <MetadataTags metadata={metadata} siteName={config.site.siteName} />
      <RenderEngine {...renderProps} />
    </>
  )
}

export default NotFound
