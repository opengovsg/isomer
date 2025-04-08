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
    image: Type.Optional(
      Type.String({
        title: "Meta image",
        description:
          "This image may appear when the page is shared on social media such as LinkedIn or Facebook.",
        format: "meta-image",
      }),
    ),
  }),
])

export const ArticlePageMetaSchema = BasePageMetaSchema
export const ContentPageMetaSchema = BasePageMetaSchema
export const CollectionPageMetaSchema = BasePageMetaSchema
export const DatabasePageMetaSchema = BasePageMetaSchema
export const HomePageMetaSchema = BasePageMetaSchema
export const NotFoundPageMetaSchema = BasePageMetaSchema
export const SearchPageMetaSchema = BasePageMetaSchema

export const FileRefMetaSchema = BaseItemMetaSchema
export const LinkRefMetaSchema = BaseItemMetaSchema

export type ArticlePageMetaProps = Static<typeof ArticlePageMetaSchema>
export type CollectionPageMetaProps = Static<typeof CollectionPageMetaSchema>
export type ContentPageMetaProps = Static<typeof ContentPageMetaSchema>
export type HomePageMetaProps = Static<typeof HomePageMetaSchema>
export type NotFoundPageMetaProps = Static<typeof NotFoundPageMetaSchema>
export type SearchPageMetaProps = Static<typeof SearchPageMetaSchema>

export type FileRefMetaProps = Static<typeof FileRefMetaSchema>
export type LinkRefMetaProps = Static<typeof LinkRefMetaSchema>
