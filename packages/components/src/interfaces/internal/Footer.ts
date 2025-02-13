import type { IsomerSiteProps, LinkComponentType } from "~/types"

export interface FooterItem {
  title: string
  url?: string
}

export const SocialMediaTypes = [
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "telegram",
  "youtube",
  "github",
  "tiktok",
  "whatsapp",
] as const

export type SocialMediaType = (typeof SocialMediaTypes)[number]

export interface SocialMediaLink {
  type: SocialMediaType
  url: string
}

export interface SiteConfigFooterProps {
  siteNavItems: FooterItem[]
  customNavItems?: FooterItem[]
  socialMediaLinks?: SocialMediaLink[]
  contactUsLink?: string
  feedbackFormLink?: string
  privacyStatementLink: string
  termsOfUseLink: string
  siteMapLink?: string
}

export interface FooterProps extends SiteConfigFooterProps {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  isGovernment?: boolean
  siteName: string
  agencyName: string
  lastUpdated: string
}
