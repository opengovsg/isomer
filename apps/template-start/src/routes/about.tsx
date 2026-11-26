import { IsomerPageView } from "@/src/components/IsomerPageView"
import { loadPageSchema } from "@/src/lib/loadPageSchema"
import { getSiteContext } from "@/src/lib/site"
import { getMetadata } from "@opengovsg/isomer-components"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/about")({
  head: () => {
    const schema = loadPageSchema("/about/")
    if (!schema) return {}
    const ctx = getSiteContext()
    return getMetadata({
      ...schema,
      site: {
        ...ctx.config.site,
        environment: ctx.environment,
        siteMap: ctx.sitemap,
        navbar: ctx.navbar,
        footerItems: ctx.footer,
        lastUpdated: ctx.lastUpdated,
        assetsBaseUrl: ctx.assetsBaseUrl,
      },
    })
  },
  component: AboutPage,
})

function AboutPage() {
  return <IsomerPageView pathname="/about/" />
}
