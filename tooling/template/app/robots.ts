import type { MetadataRoute } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import { getRobotsTxt } from "@opengovsg/isomer-components"

export const dynamic = "force-static"

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

export default function robots(): MetadataRoute.Robots {
  return getRobotsTxt({
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
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
