import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

const BaseItemMetaSchema = Type.Object({
  description: Type.Optional(
    Type.String({
      title: "Meta description",
      description:
        "This is a description that appears on search engine results.",
      format: "textarea",
      maxLength: 160,
    }),
  ),
})

const BasePageMetaSchema = Type.Composite([
  BaseItemMetaSchema,
  Type.Object({
    noIndex: Type.Optional(
      Type.Boolean({
        description:
          "If this is turned on, the page won't appear on Google search results.",
        title: "Prevent search engines from indexing this page?",
        default: false,
      }),
    ),
  }),
])

const BaseRefMetaSchema = Type.Composite([
  BaseItemMetaSchema,
  Type.Object({
    ref: Type.String({
      title: "URL to the actual item",
      description:
        "The link that users will open immediately when they click on the item in the parent collection page",
    }),
  }),
])

export const ArticlePageMetaSchema = BasePageMetaSchema
export const ContentPageMetaSchema = BasePageMetaSchema
export const CollectionPageMetaSchema = BasePageMetaSchema
export const HomePageMetaSchema = BasePageMetaSchema
export const NotFoundPageMetaSchema = BasePageMetaSchema
export const SearchPageMetaSchema = BasePageMetaSchema

export const FileRefMetaSchema = BaseRefMetaSchema
export const LinkRefMetaSchema = BaseRefMetaSchema

export type ArticlePageMetaProps = Static<typeof ArticlePageMetaSchema>
export type CollectionPageMetaProps = Static<typeof CollectionPageMetaSchema>
export type ContentPageMetaProps = Static<typeof ContentPageMetaSchema>
export type HomePageMetaProps = Static<typeof HomePageMetaSchema>
export type NotFoundPageMetaProps = Static<typeof NotFoundPageMetaSchema>
export type SearchPageMetaProps = Static<typeof SearchPageMetaSchema>

export type FileRefMetaProps = Static<typeof FileRefMetaSchema>
export type LinkRefMetaProps = Static<typeof LinkRefMetaSchema>
