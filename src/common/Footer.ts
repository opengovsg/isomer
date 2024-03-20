export interface Link {
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
  isGovernment: boolean
  siteName: string
  agencyName: string
  lastUpdated: string
  siteNavItems: Link[]
  customNavItems?: Link[]
  socialMediaLinks?: SocialMediaLink[]
  contactUsLink?: string
  feedbackFormLink?: string
  privacyStatementLink: string
  termsOfUseLink: string
}

export default FooterProps
