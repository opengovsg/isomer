import type { IsomerSitemap } from "./sitemap"
import type {
  AskgovProps,
  NavbarProps,
  NotificationProps,
  VicaProps,
  WizgovProps,
} from "~/interfaces"
import type { SiteConfigFooterProps } from "~/interfaces/internal/Footer"

export interface IsomerGeneratedSiteProps {
  siteMap: IsomerSitemap
  environment?: string
  lastUpdated: string
  assetsBaseUrl?: string
  isomerGtmId?: string
}

export interface IsomerSiteWideComponentsProps {
  navbar: Pick<NavbarProps, "items" | "callToAction">
  footerItems: SiteConfigFooterProps
}

export interface IsomerSiteConfigProps {
  siteName: string
  url?: string
  agencyName?: string
  theme: "isomer-classic" | "isomer-next"
  logoUrl: string
  isGovernment?: boolean
  favicon?: string
  search: NavbarProps["search"]
  notification?: Omit<NotificationProps, "LinkComponent" | "site">
  siteGtmId?: string
  vica?: VicaProps
  wizgov?: WizgovProps
  askgov?: AskgovProps
}

export type IsomerSiteProps = IsomerGeneratedSiteProps &
  IsomerSiteWideComponentsProps &
  IsomerSiteConfigProps

export interface IsomerSiteThemeProps {
  colors: {
    brand: {
      canvas: {
        default: string
        alt: string
        backdrop: string
        inverse: string
      }
      interaction: {
        default: string
        hover: string
        pressed: string
      }
    }
  }
}
