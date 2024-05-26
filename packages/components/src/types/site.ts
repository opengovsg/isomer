import type { NavbarProps } from "~/interfaces"
import type { SiteConfigFooterProps } from "~/interfaces/internal/Footer"
import type { IsomerSitemap } from "./sitemap"

export interface IsomerSiteProps {
  siteName: string
  url?: string
  agencyName?: string
  siteMap: IsomerSitemap
  theme: "isomer-classic" | "isomer-next"
  logoUrl: string
  isGovernment?: boolean
  environment?: string
  favicon?: string
  lastUpdated: string
  search: NavbarProps["search"]
  navBarItems: NavbarProps["items"]
  footerItems: SiteConfigFooterProps
  notification?: string
}
