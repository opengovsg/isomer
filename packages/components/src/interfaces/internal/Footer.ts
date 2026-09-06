import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

const SocialMediaTypes = [
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
    maxLength: 50,
    title: "Link label",
  }),
  url: Type.String({
    format: "link",
    pattern: LINK_HREF_PATTERN,
    title: "Link destination",
  }),
})

export const FooterSchema = Type.Object(
  {
    contactUsLink: Type.Optional(
      Type.String({
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Contact us page",
      }),
    ),
    customNavItems: Type.Optional(
      Type.Array(FooterItemSchema, {
        format: "linkArray",
        maxItems: 8,
        title: "Footer column 2",
      }),
    ),
    feedbackFormLink: Type.Optional(
      Type.String({
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Feedback form",
      }),
    ),
    privacyStatementLink: Type.String({
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Privacy statement page",
    }),
    siteNavItems: Type.Array(FooterItemSchema, {
      format: "linkArray",
      maxItems: 8,
      title: "Footer column 1",
    }),
    socialMediaLinks: Type.Optional(
      Type.Array(
        Type.Object({
          // NOTE: Change this to Type.Enum when we upgrade to TypeBox v1
          type: Type.Unsafe<SocialMediaType>(
            Type.String({
              default: "facebook",
              enum: SocialMediaTypes,
              title: "Social media",
            }),
          ),
          url: Type.String({
            description: "Make sure you are linking an official account",
            pattern: LINK_HREF_PATTERN,
            title: "Link",
          }),
        }),
        {
          description: "Let the public connect with you.",
          format: "socialMedia",
          title: "Social media links",
        },
      ),
    ),
    termsOfUseLink: Type.String({
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Terms of use page",
    }),
  },
  {
    groups: [
      {
        fields: ["contactUsLink", "feedbackFormLink"],
        label: "Contact and feedback form",
      },
      {
        fields: ["privacyStatementLink", "termsOfUseLink"],
        label: "Legal pages",
      },
    ],
  },
)

export type FooterItem = Static<typeof FooterItemSchema>
export type FooterSchemaType = Static<typeof FooterSchema>

export interface FooterProps extends FooterSchemaType {
  site: IsomerSiteProps
  isGovernment?: boolean
  siteName: string
  agencyName: string
  lastUpdated: string
}
