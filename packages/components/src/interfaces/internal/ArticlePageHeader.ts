import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { CollectionCardProps } from "./CollectionCard"

export const ArticlePageHeaderSchema = Type.Object({
  summary: Type.String({
    title: "Article summary",
    description: "Help users understand what this page is about",
    format: "textarea",
    maxLength: 500,
  }),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Button label",
      description:
        "A descriptive text. Avoid generic text like “Here”, “Click here”, or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

export type ArticlePageHeaderProps = Static<typeof ArticlePageHeaderSchema> & {
  pillTags?: CollectionCardProps["pillTags"]
  breadcrumb: BreadcrumbProps
  title: string
  plaintextTags?: CollectionCardProps["plaintextTags"]
  date?: string
  site: IsomerSiteProps
}
