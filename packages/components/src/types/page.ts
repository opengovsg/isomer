import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { ArticlePageHeaderSchema, ContentPageHeaderSchema } from "~/interfaces"
import { SortDirections, SortKeys } from "~/interfaces/internal/CollectionSort"

const BaseItemSchema = Type.Object({
  title: Type.String({
    title: "Page title",
  }),
  description: Type.Optional(
    Type.String({
      title: "Page description",
      description: "The summary of the page for SEO purposes",
    }),
  ),
})

const BasePageSchema = Type.Composite([
  BaseItemSchema,
  Type.Object({
    noIndex: Type.Optional(
      Type.Boolean({
        description: "Whether to exclude the page from search engine indexing",
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
    defaultSortBy: Type.Union(
      SortKeys.map((key) => Type.Literal(key)),
      {
        title: "Default sort by",
        description: "The default field to sort the collection items by",
        type: "string",
      },
    ),
    defaultSortDirection: Type.Union(
      SortDirections.map((dir) => Type.Literal(dir)),
      {
        title: "Default sort direction",
        description: "The default direction to sort the collection items by",
        type: "string",
      },
    ),
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
