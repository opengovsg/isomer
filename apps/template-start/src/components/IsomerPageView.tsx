import { loadPageSchema } from "@/src/lib/loadPageSchema"
import { getSiteContext } from "@/src/lib/site"
import {
  RenderEngine,
  getPageJsonLd,
  shouldBlockIndexing,
} from "@opengovsg/isomer-components"

import { serializeForInlineScript } from "@isomer/validators"

export const IsomerPageView = ({ pathname }: { pathname: string }) => {
  const schema = loadPageSchema(pathname)
  if (!schema) {
    return <p>Page not found</p>
  }

  const {
    config,
    footer,
    navbar,
    sitemap,
    lastUpdated,
    environment,
    assetsBaseUrl,
  } = getSiteContext()

  const site = {
    ...config.site,
    environment,
    siteMap: sitemap,
    navbar,
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl,
  }

  const pageJsonLd = getPageJsonLd({
    ...schema,
    site: {
      siteName: config.site.siteName,
      url: config.site.url,
      siteMap: sitemap,
    },
  })

  return (
    <>
      <RenderEngine
        {...schema}
        site={site}
        meta={{
          noIndex: shouldBlockIndexing(environment),
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
