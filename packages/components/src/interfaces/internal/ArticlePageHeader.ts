import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { CollectionCardProps } from "./CollectionCard"

export const ArticlePageHeaderSchema = Type.Object({
  summary: Type.String({
    title: "Article summary",
    description: "Help users understand what this page is about",
    format: "textarea",
    maxLength: 500,
  }),
})

export type ArticlePageHeaderProps = Static<typeof ArticlePageHeaderSchema> & {
  pillTags?: CollectionCardProps["pillTags"]
  breadcrumb: BreadcrumbProps
  title: string
  plaintextTags?: CollectionCardProps["plaintextTags"]
  date?: string
}
