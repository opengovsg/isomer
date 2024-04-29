import type { NavbarProps } from "~/common"
import type { SiteConfigFooterProps } from "~/common/Footer"
import type { IsomerSitemap } from "./sitemap"

export type IsomerThemes = "isomer-classic" | "isomer-next"

export interface IsomerSiteProps {
  siteName: string
  url?: string
  agencyName?: string
  siteMap: IsomerSitemap
  theme: IsomerThemes
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
