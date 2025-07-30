import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"

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

const FooterItemSchema = Type.Object({
  title: Type.String({
    title: "Title of the footer item",
    maxLength: 50,
  }),
  url: Type.Optional(
    Type.String({
      title: "URL destination of the footer item",
      format: "link",
    }),
  ),
})

export const FooterSchema = Type.Object({
  siteNavItems: Type.Array(FooterItemSchema, {
    title: "Site navigation items",
    description:
      "List of footer items to be displayed in the first column. This should consist of all the site navigation items.",
  }),
  customNavItems: Type.Optional(
    Type.Array(FooterItemSchema, {
      title: "Custom navigation items",
      description: "List of footer items to be displayed in the second column.",
    }),
  ),
  socialMediaLinks: Type.Optional(
    Type.Array(
      Type.Object({
        type: Type.Unsafe<SocialMediaType>(
          Type.String({
            title: "Social media type",
            enum: SocialMediaTypes,
          }),
        ),
        url: Type.String({
          title: "URL of the social media link",
          format: "link",
        }),
      }),
      {
        title: "Social media links",
      },
    ),
  ),
  contactUsLink: Type.Optional(
    Type.String({
      title: "Contact us link",
      format: "link",
    }),
  ),
  feedbackFormLink: Type.Optional(
    Type.String({
      title: "Feedback form link",
      format: "link",
    }),
  ),
  privacyStatementLink: Type.String({
    title: "Privacy statement link",
    format: "link",
  }),
  termsOfUseLink: Type.String({
    title: "Terms of use link",
    format: "link",
  }),
  siteMapLink: Type.Optional(
    Type.String({
      title: "Site map link",
      format: "link",
    }),
  ),
})

export type FooterItem = Static<typeof FooterItemSchema>
export type FooterSchemaType = Static<typeof FooterSchema>

export interface FooterProps extends FooterSchemaType {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  isGovernment?: boolean
  siteName: string
  agencyName: string
  lastUpdated: string
}
