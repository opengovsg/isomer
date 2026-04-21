import type { Static, StringOptions } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import {
  AltTextSchema,
  ArticlePageHeaderSchema,
  ContentPageHeaderSchema,
  generateImageSrcSchema,
  SearchableTableSchema,
} from "~/interfaces"
import { imageSchemaObject } from "~/schemas/internal"
import { REF_HREF_PATTERN } from "~/utils/validation"

// NOTE: a tag value is simply a uuid that maps to a given label;
// essentially, it is just a pointer
const generateUuidSchema = (options: Omit<StringOptions, "format">) =>
  Type.String({ format: "uuid", ...options })

export const TagOptionUuidSchema = generateUuidSchema({
  title: "Uuid of a single tag option",
  description:
    "This is the uuid of a single tag option and will be used to uniquely identify it. This is the uuid of the options of each category",
})
export const TagCategoryUuidSchema = generateUuidSchema({
  title: "Uuid of a single tag",
  description:
    "This is the uuid of a single tag category and will be used to uniquely identify it.",
})

const TagCategorySchema = Type.Composite([
  Type.Object({
    label: Type.String({ maxLength: 70, title: "Filter name" }),
    id: TagOptionUuidSchema,
  }),
  Type.Object({
    // Optional for backward compatibility. Missing/`undefined` must be read as `false`.
    // Omit JSON Schema `default`: Studio AJV runs with useDefaults, which would apply the
    // same default to legacy rows that omit this key. New filters set `isRequired: true` in
    // the tag-categories JsonForms control when adding an item.
    isRequired: Type.Optional(
      Type.Boolean({
        title: "This filter is required",
        description:
          "Every item must have at least one option selected from this filter.",
      }),
    ),
  }),
  Type.Object({
    options: Type.Array(
      Type.Object({
        label: Type.String({ maxLength: 70, title: "Option name" }),
        id: TagOptionUuidSchema,
      }),
      {
        title: "Options",
        description:
          "Collection filter will display options in this order. Only options that are in use will appear on the Preview.",
        addItemLabel: "Add option",
        format: "tag-category-options",
        /**
         * Studio AJV: duplicate option names (case-insensitive, trim) fail validation in JsonForms.
         * @see {@link ../../../../apps/studio/src/utils/ajv.ts}
         */
        uniqueItemPropertiesIgnoreCase: ["label"],
      },
    ),
  }),
])
// NOTE: can be optional because the categories might not exist
const TagCategoriesSchema = Type.Object({
  tagCategories: Type.Optional(
    Type.Array(TagCategorySchema, {
      title: "Filters",
      description:
        "Add filters so visitors can find what they need. Editors can assign these options on items they create.",
      addItemLabel: "Add a filter",
      format: "tag-categories",
      /**
       * Studio AJV: duplicate filter names (case-insensitive, trim) fail validation in JsonForms.
       * @see {@link ../../../../apps/studio/src/utils/ajv.ts}
       */
      uniqueItemPropertiesIgnoreCase: ["label"],
    }),
  ),
})
const TaggedSchema = Type.Optional(
  // NOTE: This stores the `uuid` of the tag option
  Type.Array(TagOptionUuidSchema, {
    // NOTE: we need a custom format because this cannot just be a simple drop down
    // as we need to reference the existing data that is pointing to this
    format: "tagged",
    description: "To add new options, contact your site owner(s).",
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
  categorySchemaObject,
  Type.Object({ tagged: TaggedSchema }),
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
        maxLength: 500,
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
    tags: Type.Optional(Type.Array(TagSchema, { format: "hidden" })),
  },
  // NOTE: we need to hide this because it's not supposed to be visible to our end user
  { format: "hidden" },
)

export const ArticlePagePageSchema = Type.Composite([
  categorySchemaObject,
  Type.Object({ tagged: TaggedSchema }),
  dateSchemaObject,
  Type.Object({
    articlePageHeader: ArticlePageHeaderSchema,
  }),
  imageSchemaObject,
])

export const COLLECTION_VARIANT_OPTIONS = {
  Blog: "blog",
  Collection: "collection",
} as const

const COLLECTION_PAGE_SORT_BY = {
  date: "date",
  title: "title",
  category: "category",
} as const

const COLLECTION_PAGE_SORT_DIRECTION = {
  asc: "asc",
  desc: "desc",
} as const

export const CollectionPagePageSchema = Type.Intersect([
  Type.Object({
    subtitle: Type.String({
      title: "Summary",
      format: "textarea",
    }),
  }),
  Type.Object({
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal(COLLECTION_VARIANT_OPTIONS.Collection, {
            title: "1-column",
          }),
          Type.Literal(COLLECTION_VARIANT_OPTIONS.Blog, { title: "2-column" }),
        ],
        {
          title: "Layout",
          format: "collection-variant",
          default: COLLECTION_VARIANT_OPTIONS.Collection,
        },
      ),
    ),
    sortOrder: Type.Optional(
      Type.Union(
        [
          Type.Literal("date-desc", {
            title: "By article date, newest → oldest",
          }),
          Type.Literal("date-asc", {
            title: "By article date, oldest → newest",
          }),
          Type.Literal("title-asc", { title: "By title, A → Z" }),
          Type.Literal("title-desc", { title: "By title, Z → A" }),
          Type.Literal("category-asc", { title: "By category, A → Z" }),
          Type.Literal("category-desc", { title: "By category, Z → A" }),
        ],
        {
          title: "Sort items by",
          description: "This might take a while to reflect on the preview.",
          type: "string",
          default: "date-desc",
        },
      ),
    ),
    // Deprecated, will be replaced with sortOrder above
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
          default: COLLECTION_PAGE_SORT_BY.date,
        },
      ),
    ),
    // Deprecated, will be replaced with sortOrder above
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
          default: COLLECTION_PAGE_SORT_DIRECTION.desc,
        },
      ),
    ),
    showDate: Type.Optional(
      Type.Boolean({
        title: "Show date on all items",
        description:
          "If an item doesn't have a date, we'll display a dash (-).",
        default: true,
      }),
    ),
    image: Type.Optional(
      Type.Object(
        {
          src: generateImageSrcSchema({
            title: "Thumbnail",
            description:
              "Upload an image if you want to have a custom thumbnail",
          }),
          alt: AltTextSchema,
        },
        {
          title: "Set a thumbnail",
          description:
            "When this page is linked elsewhere on your site, this thumbnail may appear alongside it.",
        },
      ),
    ),
  }),
  TagCategoriesSchema,
  TagsSchema,
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

export const DatabasePagePageSchema = Type.Composite([
  Type.Object({
    contentPageHeader: ContentPageHeaderSchema,
    database: SearchableTableSchema,
  }),
  imageSchemaObject,
])

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

export type ArticlePagePageProps = Static<typeof ArticlePagePageSchema> &
  BasePageAdditionalProps &
  ArticlePageAdditionalProps
export type CollectionPagePageProps = Static<typeof CollectionPagePageSchema> &
  BasePageAdditionalProps
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
