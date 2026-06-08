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
    title: "Link label",
    maxLength: 50,
  }),
  url: Type.String({
    title: "Link destination",
    format: "link",
    pattern: LINK_HREF_PATTERN,
  }),
})

const SubscriptionCtaSchema = Type.Object(
  {
    title: Type.String({
      title: "Title",
      description: "A short heading for the CTA",
      maxLength: 100,
    }),
    description: Type.Optional(
      Type.String({
        title: "Description",
        description: "A brief message to encourage subscription",
        maxLength: 200,
      }),
    ),
    buttonLabel: Type.String({
      title: "Button label",
      description: "The text displayed on the CTA button",
      maxLength: 30,
      default: "Subscribe",
    }),
    buttonUrl: Type.String({
      title: "Button link",
      description: "The URL the button links to (e.g., FormSG or mailing list)",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  },
  {
    $id: "SubscriptionCta",
    title: "Subscription CTA",
  },
)

export type SubscriptionCta = Static<typeof SubscriptionCtaSchema>

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
    subscriptionCta: Type.Optional(
      Type.Ref(SubscriptionCtaSchema, {
        title: "Mailing list subscription",
        description:
          "Add a CTA section for users to subscribe to your mailing list",
      }),
    ),
  },
  {
    $defs: {
      SubscriptionCta: SubscriptionCtaSchema,
    },
    groups: [
      {
        label: "Contact and feedback form",
        fields: ["contactUsLink", "feedbackFormLink"],
      },
      {
        label: "Legal pages",
        fields: ["privacyStatementLink", "termsOfUseLink"],
      },
      {
        label: "Mailing list",
        fields: ["subscriptionCta"],
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
