import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../format"
import { LinkHubProseSchema } from "../native/Prose"

export const LINK_HUB_MAX_LINKS = 10

export const LINK_HUB_VARIANT = {
  vertical: "vertical",
  horizontal: "horizontal",
} as const

const LinkHubLinkSchema = Type.Object({
  title: Type.String({
    title: "Link title",
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  url: Type.String({
    title: "Link destination",
    description: "When this is clicked, open:",
    format: "link",
    pattern: LINK_HREF_PATTERN,
  }),
})

const LinkHubLinksSchema = Type.Array(LinkHubLinkSchema, {
  title: "Links",
  minItems: 1,
  maxItems: LINK_HUB_MAX_LINKS,
  default: [],
})

const LinkHubBaseSchema = Type.Object({
  type: Type.Literal("linkhub", { default: "linkhub" }),
  title: Type.Optional(
    Type.String({
      title: "Title",
    }),
  ),
  description: Type.Optional(LinkHubProseSchema),
})

const LinkHubVerticalSchema = Type.Object(
  {
    variant: Type.Literal(LINK_HUB_VARIANT.vertical, {
      title: "Vertical",
      default: LINK_HUB_VARIANT.vertical,
    }),
    links: LinkHubLinksSchema,
  },
  {
    title: "Vertical",
  },
)

const LinkHubHorizontalSchema = Type.Object(
  {
    variant: Type.Literal(LINK_HUB_VARIANT.horizontal, {
      title: "Horizontal",
    }),
    links: LinkHubLinksSchema,
  },
  {
    title: "Horizontal",
  },
)

export const LinkHubSchema = Type.Intersect(
  [
    LinkHubBaseSchema,
    Type.Unsafe<
      | Static<typeof LinkHubVerticalSchema>
      | Static<typeof LinkHubHorizontalSchema>
    >({
      oneOf: [LinkHubVerticalSchema, LinkHubHorizontalSchema],
      discriminator: { propertyName: "variant" },
      format: ARRAY_RADIO_FORMAT,
      title: "Layout",
    }),
  ],
  {
    title: "Link hub",
    description: "A component that displays a curated list of links",
  },
)

export type LinkHubLinkProps = Static<typeof LinkHubLinkSchema>
export type LinkHubProps = Static<typeof LinkHubSchema> & {
  site: IsomerSiteProps
}
