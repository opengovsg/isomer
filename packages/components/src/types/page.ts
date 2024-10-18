import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import {
  ArticlePageHeaderSchema,
  ContentPageHeaderSchema,
  SearchableTableSchema,
} from "~/interfaces"

const BaseCollectionItemPageSchema = Type.Object({
  category: Type.String({
    title: "Category of the actual item",
    description:
      "The category is used for filtering in the parent collection page",
  }),
  date: Type.String({
    title: "Date of the actual item",
    format: "date",
  }),
  image: Type.Optional(
    Type.Object({
      src: Type.String({
        title: "Image source URL",
        description: "The source URL of the image",
        format: "image",
      }),
      alt: Type.String({
        title: "Image alt text",
        description: "The alt text of the image",
        maxLength: 120,
      }),
    }),
  ),
})

const BaseRefPageSchema = Type.Object({
  ref: Type.String({
    title: "Link to the item",
    description: "Choose a page or file to link to this Collection item",
    format: "ref",
  }),
  summary: Type.Optional(
    Type.String({
      title: "Summary",
      description: "This will appear on the collection",
      format: "textarea",
    }),
  ),
})

export const ArticlePagePageSchema = Type.Composite([
  BaseCollectionItemPageSchema,
  Type.Object({
    articlePageHeader: ArticlePageHeaderSchema,
  }),
])

export const CollectionPagePageSchema = Type.Object({
  subtitle: Type.String({
    title: "The subtitle of the collection",
  }),
})

export const ContentPagePageSchema = Type.Object({
  contentPageHeader: ContentPageHeaderSchema,
})

export const DatabasePagePageSchema = Type.Object({
  contentPageHeader: ContentPageHeaderSchema,
  database: SearchableTableSchema,
})

export const HomePagePageSchema = Type.Object({})
export const NotFoundPagePageSchema = Type.Object({})
export const SearchPagePageSchema = Type.Object({})

export const FileRefPageSchema = BaseRefPageSchema
export const LinkRefPageSchema = BaseRefPageSchema

// These are props that are required by the render engine, but not enforced by
// the JSON schema (as the data is being stored outside of the page JSON)
interface BaseItemAdditionalProps {
  permalink: string
  lastModified: string
  title: string
}
type BasePageAdditionalProps = BaseItemAdditionalProps & {
  language?: "en"
}

export type ArticlePagePageProps = Static<typeof ArticlePagePageSchema> &
  BasePageAdditionalProps
export type CollectionPagePageProps = Static<typeof CollectionPagePageSchema> &
  BasePageAdditionalProps
export type ContentPagePageProps = Static<typeof ContentPagePageSchema> &
  BasePageAdditionalProps
export type DatabasePagePageProps = Static<typeof DatabasePagePageSchema> &
  BasePageAdditionalProps
export type HomePagePageProps = Static<typeof HomePagePageSchema> &
  BasePageAdditionalProps
export type NotFoundPagePageProps = Static<typeof NotFoundPagePageSchema> &
  BasePageAdditionalProps
export type SearchPagePageProps = Static<typeof SearchPagePageSchema> &
  BasePageAdditionalProps

export type FileRefPageProps = Static<typeof FileRefPageSchema> &
  BaseItemAdditionalProps
export type LinkRefPageProps = Static<typeof LinkRefPageSchema> &
  BaseItemAdditionalProps
