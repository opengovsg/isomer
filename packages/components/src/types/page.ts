import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { ArticlePageHeaderSchema, ContentPageHeaderSchema } from "~/interfaces"

const BaseItemSchema = Type.Object({
  description: Type.Optional(
    Type.String({
      title: "Meta description",
      description:
        "This is a description that appears on search engine results.",
    }),
  ),
})

const BasePageSchema = Type.Composite([
  BaseItemSchema,
  Type.Object({
    noIndex: Type.Optional(
      Type.Boolean({
        description:
          "If this is turned on, the page won't appear on Google search results.",
        title: "Prevent search engines from indexing this page?",
      }),
    ),
  }),
])

const BaseRefSchema = Type.Composite([
  BaseItemSchema,
  Type.Object({
    ref: Type.String({
      title: "URL to the actual item",
      description:
        "The link that users will open immediately when they click on the item in the parent collection page",
    }),
    category: Type.String({
      title: "Category of the actual item",
      description:
        "The category is used for filtering in the parent collection page",
    }),
    date: Type.String({
      title: "Date of the actual item",
    }),
    image: Type.Optional(
      Type.Object({
        src: Type.String({
          title: "Image source URL",
          description: "The source URL of the image",
        }),
        alt: Type.String({
          title: "Image alt text",
          description: "The alt text of the image",
          maxLength: 120,
        }),
      }),
    ),
  }),
])

export const ArticlePageMetaSchema = Type.Composite([
  BasePageSchema,
  Type.Object({
    category: Type.String({
      title: "Category of the article",
      description:
        "The category is used for filtering in the parent collection page.",
    }),
    date: Type.String({
      title: "Date of the article",
    }),
    image: Type.Optional(
      Type.Object({
        src: Type.String({
          title: "Image source URL",
          description: "The source URL of the image",
        }),
        alt: Type.String({
          title: "Image alt text",
          description: "The alt text of the image",
        }),
      }),
    ),
    articlePageHeader: ArticlePageHeaderSchema,
  }),
])

export const CollectionPageMetaSchema = Type.Composite([
  BasePageSchema,
  Type.Object({
    subtitle: Type.String({
      title: "The subtitle of the collection",
    }),
  }),
])

export const ContentPageMetaSchema = Type.Composite([
  BasePageSchema,
  Type.Object({
    contentPageHeader: ContentPageHeaderSchema,
  }),
])

export const HomePageMetaSchema = BasePageSchema
export const NotFoundPageMetaSchema = BasePageSchema
export const SearchPageMetaSchema = BasePageSchema

export const FileRefMetaSchema = BaseRefSchema
export const LinkRefMetaSchema = BaseRefSchema

interface BaseItemAdditionalProps {
  permalink: string
  lastModified: string
  title: string
}
type BasePageAdditionalProps = BaseItemAdditionalProps & {
  language?: "en"
}

export type ArticlePageProps = Static<typeof ArticlePageMetaSchema> &
  BasePageAdditionalProps
export type CollectionPageProps = Static<typeof CollectionPageMetaSchema> &
  BasePageAdditionalProps
export type ContentPageProps = Static<typeof ContentPageMetaSchema> &
  BasePageAdditionalProps
export type HomePageProps = Static<typeof HomePageMetaSchema> &
  BasePageAdditionalProps
export type NotFoundPageProps = Static<typeof NotFoundPageMetaSchema> &
  BasePageAdditionalProps
export type SearchPageProps = Static<typeof SearchPageMetaSchema> &
  BasePageAdditionalProps

export type FileRefProps = Static<typeof FileRefMetaSchema> &
  BaseItemAdditionalProps
export type LinkRefProps = Static<typeof LinkRefMetaSchema> &
  BaseItemAdditionalProps
