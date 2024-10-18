import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { CollectionCardProps } from "./CollectionCard"
import type { LinkComponentType } from "~/types"

export const ArticlePageHeaderSchema = Type.Object({
  summary: Type.Optional(
    Type.String({
      title: "Article summary",
      description: "The summary of the article’s content",
      format: "textarea",
      maxLength: 250,
    }),
  ),
})

export type ArticlePageHeaderProps = Static<typeof ArticlePageHeaderSchema> & {
  breadcrumb: BreadcrumbProps
  title: string
  category: CollectionCardProps["category"]
  date: CollectionCardProps["lastUpdated"]
  LinkComponent?: LinkComponentType
}
