import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

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
  "flickr",
  "threads",
] as const

export type SocialMediaType = (typeof SocialMediaTypes)[number]

const FooterItemSchema = Type.Object({
  title: Type.String({
    title: "Link label",
    maxLength: 50,
  }),
  url: Type.String({
    title: "Link destination",
    format: "link",
    pattern: LINK_HREF_PATTERN,
  }),
})

export const FooterSchema = Type.Object(
  {
    siteNavItems: Type.Array(FooterItemSchema, {
      title: "Footer column 1",
      maxItems: 8,
      format: "linkArray",
    }),
    customNavItems: Type.Optional(
      Type.Array(FooterItemSchema, {
        title: "Footer column 2",
        maxItems: 8,
        format: "linkArray",
      }),
    ),
    socialMediaLinks: Type.Optional(
      Type.Array(
        Type.Object({
          // TODO: Change this to Type.Enum when we upgrade to TypeBox v1
          type: Type.Unsafe<SocialMediaType>(
            Type.String({
              title: "Social media",
              enum: SocialMediaTypes,
              default: "facebook",
            }),
          ),
          url: Type.String({
            title: "Link",
            description: "Make sure you are linking an official account",
            pattern: LINK_HREF_PATTERN,
          }),
        }),
        {
          title: "Social media links",
          description: "Let the public connect with you.",
          format: "socialMedia",
        },
      ),
    ),
    contactUsLink: Type.Optional(
      Type.String({
        title: "Contact us page",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
    feedbackFormLink: Type.Optional(
      Type.String({
        title: "Feedback form",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
    privacyStatementLink: Type.String({
      title: "Privacy statement page",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
    termsOfUseLink: Type.String({
      title: "Terms of use page",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  },
  {
    groups: [
      {
        label: "Contact and feedback form",
        fields: ["contactUsLink", "feedbackFormLink"],
      },
      {
        label: "Legal pages",
        fields: ["privacyStatementLink", "termsOfUseLink"],
      },
    ],
  },
)

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
