import type { MetadataRoute } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import { getRobotsTxt } from "@opengovsg/isomer-components"

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
      // TODO: fixup all the typing errors
      // @ts-ignore to fix when types are proper
      siteMap: sitemap,
      navBarItems: navbar,
      // TODO: fixup all the typing errors
      // @ts-ignore to fix when types are proper
      footerItems: footer,
      lastUpdated,
    },
  })
}
