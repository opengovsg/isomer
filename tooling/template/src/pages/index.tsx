import type { IsomerSiteProps } from "@opengovsg/isomer-components"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import MetadataTags from "@/src/templates/metadata-tags"
import {
  getMetadata,
  RenderEngine,
  shouldBlockIndexing,
} from "@opengovsg/isomer-components"

import { getSchema } from "./[...permalink]"

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

export const getConfig = () => ({
  render: "static" as const,
})

const IndexPage = async () => {
  // Empty-string permalink triggers the _index.json fallback in getSchema.
  const schema = await getSchema([""])
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

export default IndexPage
