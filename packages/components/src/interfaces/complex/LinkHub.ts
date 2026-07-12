import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { LinkHubProseSchema } from "../native/Prose"

export const LINK_HUB_MAX_LINKS = 10

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

export const LinkHubSchema = Type.Object(
  {
    type: Type.Literal("linkhub", { default: "linkhub" }),
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
    description: Type.Optional(LinkHubProseSchema),
    links: Type.Array(LinkHubLinkSchema, {
      title: "Links",
      minItems: 1,
      maxItems: LINK_HUB_MAX_LINKS,
      default: [],
    }),
  },
  {
    title: "Link hub",
    description: "A component that displays a curated list of links",
  },
)

export type LinkHubLinkProps = Static<typeof LinkHubLinkSchema>
export type LinkHubProps = Static<typeof LinkHubSchema> & {
  site: IsomerSiteProps
}
