import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const RELATED_LINKS_MAX_ITEMS = 7

const RelatedLinkSchema = Type.Object({
  title: Type.String({
    title: "Title",
  }),
  url: Type.String({
    title: "Link destination",
    description: "When this is clicked, open:",
    format: "link",
    pattern: LINK_HREF_PATTERN,
  }),
})

export const RelatedLinksSchema = Type.Object(
  {
    type: Type.Literal("relatedlinks", { default: "relatedlinks" }),
    heading: Type.Optional(
      Type.String({
        title: "Heading",
        default: "Related links",
      }),
    ),
    links: Type.Array(RelatedLinkSchema, {
      title: "Links",
      minItems: 1,
      maxItems: RELATED_LINKS_MAX_ITEMS,
    }),
  },
  {
    title: "Related links",
    description:
      "A component that displays a list of links related to the current page.",
  },
)

export type RelatedLinksProps = Static<typeof RelatedLinksSchema>
