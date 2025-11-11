import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { CollectionCardProps } from "./CollectionCard"
import type { LinkComponentType } from "~/types"

export const ArticlePageHeaderSchema = Type.Object({
  summary: Type.String({
    title: "Article summary",
    description: "Help users understand what this page is about",
    format: "textarea",
    maxLength: 500,
  }),
})

export type ArticlePageHeaderProps = Static<typeof ArticlePageHeaderSchema> & {
  tags?: CollectionCardProps["tags"]
  breadcrumb: BreadcrumbProps
  title: string
  category: CollectionCardProps["category"]
  date?: string
  LinkComponent?: LinkComponentType
}
