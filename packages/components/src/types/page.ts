import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { CollectionVariant } from "./variants"
import {
  ArticlePageHeaderSchema,
  ContentPageHeaderSchema,
  NativeSearchableTableSchema,
} from "~/interfaces"
import { imageSchemaObject } from "~/schemas/internal"
import { REF_HREF_PATTERN } from "~/utils/validation"

const categorySchemaObject = Type.Object({
  category: Type.String({
    title: "Article category",
    format: "category",
    description:
      "The category is used for filtering in the parent collection page",
  }),
})

const dateSchemaObject = Type.Object({
  date: Type.Optional(
    Type.String({
      title: "Article date",
      format: "date",
    }),
  ),
})

const BaseRefPageSchema = Type.Composite([
  categorySchemaObject,
  dateSchemaObject,
  imageSchemaObject,
  Type.Object({
    ref: Type.String({
      title: "Link",
      description: "Choose a page or file to link to this Collection item",
      format: "ref",
      pattern: REF_HREF_PATTERN,
    }),
    description: Type.Optional(
      Type.String({
        title: "Summary",
        description:
          "Add a short description to explain what this collection item is about",
        format: "textarea",
        maxLength: 120,
      }),
    ),
  }),
])

const TagSchema = Type.Object({
  selected: Type.Array(Type.String()),
  category: Type.String(),
})

const TagsSchema = Type.Object({
  tags: Type.Optional(Type.Array(TagSchema)),
})

export const ArticlePagePageSchema = Type.Composite([
  dateSchemaObject,
  Type.Object({
    articlePageHeader: ArticlePageHeaderSchema,
  }),
  categorySchemaObject,
  imageSchemaObject,
])

const COLLECTION_PAGE_SORT_BY = {
  date: "date",
  title: "title",
  category: "category",
} as const

export const COLLECTION_PAGE_DEFAULT_SORT_BY = COLLECTION_PAGE_SORT_BY.date

const COLLECTION_PAGE_SORT_DIRECTION = {
  asc: "asc",
  desc: "desc",
} as const

export const COLLECTION_PAGE_DEFAULT_SORT_DIRECTION =
  COLLECTION_PAGE_SORT_DIRECTION.desc

export const CollectionPagePageSchema = Type.Intersect([
  Type.Object({
    subtitle: Type.String({
      title: "The subtitle of the collection",
    }),
  }),
  TagsSchema,
  Type.Object({
    defaultSortBy: Type.Optional(
      Type.Union(
        [
          Type.Literal(COLLECTION_PAGE_SORT_BY.date, { title: "Date" }),
          Type.Literal(COLLECTION_PAGE_SORT_BY.title, { title: "Title" }),
          Type.Literal(COLLECTION_PAGE_SORT_BY.category, { title: "Category" }),
        ],
        {
          title: "Default sort by",
          description: "The default sort order of the collection",
          format: "hidden",
          type: "string",
          default: COLLECTION_PAGE_DEFAULT_SORT_BY,
        },
      ),
    ),
    defaultSortDirection: Type.Optional(
      Type.Union(
        [
          Type.Literal(COLLECTION_PAGE_SORT_DIRECTION.asc, {
            title: "Ascending",
          }),
          Type.Literal(COLLECTION_PAGE_SORT_DIRECTION.desc, {
            title: "Descending",
          }),
        ],
        {
          title: "Default sort direction",
          description: "The default sort direction of the collection",
          format: "hidden",
          type: "string",
          default: COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
        },
      ),
    ),
  }),
])

export const ContentPagePageSchema = Type.Composite([
  Type.Object({
    contentPageHeader: ContentPageHeaderSchema,
  }),
  imageSchemaObject,
])

export const DatabasePagePageSchema = Type.Object({
  contentPageHeader: ContentPageHeaderSchema,
  database: NativeSearchableTableSchema,
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

interface ArticlePageAdditionalProps {
  tags?: CollectionPagePageProps["tags"]
}

interface CollectionVariantProps {
  variant?: CollectionVariant
}

export type ArticlePagePageProps = Static<typeof ArticlePagePageSchema> &
  BasePageAdditionalProps &
  ArticlePageAdditionalProps
export type CollectionPagePageProps = Static<typeof CollectionPagePageSchema> &
  BasePageAdditionalProps &
  CollectionVariantProps
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
