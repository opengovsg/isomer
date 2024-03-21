export interface FooterItem {
  title: string
  url: string
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
] as const

export type SocialMediaType = (typeof SocialMediaTypes)[number]

export interface SocialMediaLink {
  type: SocialMediaType
  url: string
}

export interface FooterProps {
  type: "footer"
  LinkComponent?: any
  isGovernment: boolean
  siteName: string
  agencyName: string
  lastUpdated: string
  siteNavItems: FooterItem[]
  customNavItems?: FooterItem[]
  socialMediaLinks?: SocialMediaLink[]
  contactUsLink?: string
  feedbackFormLink?: string
  privacyStatementLink: string
  termsOfUseLink: string
  siteMapLink: string
}

export default FooterProps
