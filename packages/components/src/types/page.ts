import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { CollectionVariant } from "./variants"
import {
  ArticlePageHeaderSchema,
  ContentPageHeaderSchema,
  SearchableTableSchema,
} from "~/interfaces"
import { imageSchemaObject } from "~/schemas/internal"
import { REF_HREF_PATTERN } from "~/utils/validation"

// NOTE: a tag value is simply a uuid that maps to a given label;
// essentially, it is just a pointer
const UuidSchema = Type.String({ format: "uuid" })
export const TagValueSchema = UuidSchema
// NOTE: single value for now but we might extend this in the future with additional metadata,
// so we will leave it as is
const DropdownItemSchema = Type.Object({ label: Type.String(), id: UuidSchema })
const TagOptionSchema = DropdownItemSchema
const TagCategorySchema = Type.Composite([
  Type.Object({
    options: Type.Array(TagOptionSchema),
  }),
  DropdownItemSchema,
])
// NOTE: can be optional because the categories might not exist
const TagCategoriesSchema = Type.Object({
  tagCategories: Type.Optional(Type.Array(TagCategorySchema)),
})
const TaggedSchema = Type.Optional(
  // NOTE: This stores the `uuid` of the tag category
  // to the array of the `uuid` of the values:
  // `[category_uuid_1: [value_uuid_1, value_uuid_2], category_uuid_2: [value_uuid_3]]`.
  // we cannot just store a plain array of `uuid`
  // because we need to render each category as a dropdown
  Type.Array(Type.Record(TagValueSchema, Type.Array(TagValueSchema)), {
    // NOTE: we need a custom format because this cannot just be a simple drop down
    // as we need to reference the existing data that is pointing to this
    format: "tagged",
  }),
)

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
  Type.Object({ tagged: TaggedSchema }),
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

// NOTE: old tag schema that we should migrate away
// because we sit on the `tag` key,
// we cannot reuse it for our new tags
const TagSchema = Type.Object({
  selected: Type.Array(Type.String()),
  category: Type.String(),
})
const TagsSchema = Type.Object(
  {
    tags: Type.Optional(Type.Array(TagSchema)),
  },
  // NOTE: we need to hide this because it's not supposed to be visible to our end user
  { format: "hidden" },
)

export const ArticlePagePageSchema = Type.Composite([
  dateSchemaObject,
  Type.Object({
    articlePageHeader: ArticlePageHeaderSchema,
  }),
  categorySchemaObject,
  imageSchemaObject,
  Type.Object({ tagged: TaggedSchema }),
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
  TagCategoriesSchema,
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

// NOTE: Previously, index page's header and content page's header
// are identical but we are splitting them apart now.
// This is the index page's header
// should fully own the state of the collection/folder
// but the content page header should not.
// Doing a straight copy paste rather than `Type.Composite`
// to avoid unexpected spillover of properties
export const IndexPagePageSchema = Type.Composite([
  Type.Object({
    contentPageHeader: ContentPageHeaderSchema,
  }),
  imageSchemaObject,
])

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
export type IndexPagePageProps = Static<typeof IndexPagePageSchema> &
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
