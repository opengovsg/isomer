import type { MetadataRoute } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import { formatLastUpdated } from "@/lib/formatLastUpdated"
import sitemap from "@/sitemap.json"
import { getRobotsTxt } from "@opengovsg/isomer-components"

export const dynamic = "force-static"

const lastUpdated = formatLastUpdated(new Date())

export default function robots(): MetadataRoute.Robots {
  return getRobotsTxt({
    // TODO: fixup all the typing errors
    site: {
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
    },
  })
}
