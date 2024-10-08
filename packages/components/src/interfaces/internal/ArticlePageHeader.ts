import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { CollectionCardProps } from "./CollectionCard"
import type { LinkComponentType } from "~/types"

export const ArticlePageHeaderSchema = Type.Object({
  summary: Type.Array(Type.String(), {
    title: "Article summary",
    description:
      "The summary of the article page's content. Having multiple items will display them as a list.",
    minItems: 0,
  }),
})

export type ArticlePageHeaderProps = Static<typeof ArticlePageHeaderSchema> & {
  breadcrumb: BreadcrumbProps
  title: string
  category: CollectionCardProps["category"]
  date: CollectionCardProps["lastUpdated"]
  LinkComponent?: LinkComponentType
}
