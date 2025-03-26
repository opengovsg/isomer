import type { IsomerSitemap } from "./sitemap"
import type {
  NavbarProps,
  NotificationProps,
  VicaWidgetProps,
  WizgovWidgetProps,
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
  navBarItems: NavbarProps["items"]
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
  vica?: VicaWidgetProps
  wizgov?: WizgovWidgetProps
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
