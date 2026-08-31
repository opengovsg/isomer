import type { Static, StringOptions } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import {
  AltTextSchema,
  ARRAY_RADIO_FORMAT,
  ArticlePageHeaderSchema,
  ContentPageHeaderSchema,
  generateImageSrcSchema,
  SearchableTableSchema,
} from "~/interfaces"
import { imageSchemaObject } from "~/schemas/internal"
import {
  REF_HREF_PATTERN,
  TRIMMED_NON_EMPTY_STRING_REGEX,
  TRIMMED_STRING_OR_EMPTY_REGEX,
} from "~/utils/validation"

import {
  DATE_FILTER_STATUS_ID,
  TAG_CATEGORY_DISPLAY_OPTIONS,
  TAG_CATEGORY_TYPE,
  type TagCategoryDisplay,
} from "./constants"

// NOTE: a tag value is simply a uuid that maps to a given label;
// essentially, it is just a pointer
const generateUuidSchema = (options: Omit<StringOptions, "format">) =>
  Type.String({ format: "uuid", ...options })

const TagOptionUuidSchema = generateUuidSchema({
  title: "Uuid of a single tag option",
  description:
    "This is the uuid of a single tag option and will be used to uniquely identify it. This is the uuid of the options of each category",
})
const TagCategoryUuidSchema = generateUuidSchema({
  title: "Uuid of a single tag",
  description:
    "This is the uuid of a single tag category and will be used to uniquely identify it.",
})

const DateFilterStatusIdSchema = Type.Union([
  Type.Literal(DATE_FILTER_STATUS_ID.Ended),
  Type.Literal(DATE_FILTER_STATUS_ID.Ongoing),
  Type.Literal(DATE_FILTER_STATUS_ID.Upcoming),
])

const tagCategoryLabelSchemaObject = {
  label: Type.String({
    title: "Filter name",
    pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or have leading/trailing spaces",
    },
  }),
  id: TagCategoryUuidSchema,
}

const tagCategoryIsRequiredSchemaObject = {
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
}

const dateFilterIsRequiredSchemaObject = {
  // Same semantics as `tagCategoryIsRequiredSchemaObject`, but date filters use
  // item-specific copy in Studio because the requirement applies to dates, not
  // tag options.
  isRequired: Type.Optional(
    Type.Boolean({
      title: "This date is required",
      description: "Every item must have a date entered for this filter.",
    }),
  ),
}

const TextFilterSchema = Type.Object(
  {
    ...tagCategoryLabelSchemaObject,
    // Optional for backward compatibility — every pre-existing `tagCategories`
    // entry was a text filter before date filters existed. Must stay
    // `"text"` or absent (never `"date"`) so this branch and `DateFilterSchema`
    // remain mutually exclusive for `oneOf` resolution.
    type: Type.Optional(
      Type.Literal(TAG_CATEGORY_TYPE.Text, { format: "hidden" }),
    ),
    ...tagCategoryIsRequiredSchemaObject,
    // Optional for backward compatibility. Missing/`undefined` must be read as
    // `DEFAULT_TAG_CATEGORY_DISPLAY` via `resolveTagCategoryDisplay`.
    // Omit JSON Schema `default`: Studio AJV runs with useDefaults, which would apply the
    // same default to legacy rows that omit this key. New filters set
    // `display: DEFAULT_TAG_CATEGORY_DISPLAY` in the tag-categories JsonForms control
    // when adding an item.
    display: Type.Optional(
      Type.Unsafe<TagCategoryDisplay>({
        oneOf: [
          {
            const: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
            image: "tagcategory/pills",
          },
          {
            const: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
            image: "tagcategory/plaintext",
          },
        ],
        title: "Show as",
        format: "image-radio/2col",
      }),
    ),
    options: Type.Array(
      Type.Object({
        label: Type.String({
          title: "Option name",
          pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
          errorMessage: {
            pattern: "cannot be empty or have leading/trailing spaces",
          },
        }),
        id: TagOptionUuidSchema,
      }),
      {
        title: "Options",
        description:
          "Collection filter will display options in this order. Only options that are in use will appear on the Preview.",
        format: "tag-category-options",
      },
    ),
  },
  { title: "Text filter" },
)

const DateFilterSchema = Type.Object(
  {
    ...tagCategoryLabelSchemaObject,
    // Required (never absent) — a date filter is only ever created going
    // forward via the type-choice modal, never a legacy row. Must stay
    // `"date"` so this branch and `TextFilterSchema` remain mutually
    // exclusive for `oneOf` resolution.
    type: Type.Literal(TAG_CATEGORY_TYPE.Date, { format: "hidden" }),
    ...dateFilterIsRequiredSchemaObject,
    // Fixed at exactly 3 entries, keyed by the well-known
    // `DATE_FILTER_STATUS_ID`s — only the `label` is admin-editable (the admin
    // UI hides add/remove for this list); the id set itself is what future
    // work would need to extend, not something today's UI exposes.
    statusLabels: Type.Array(
      Type.Object({
        id: DateFilterStatusIdSchema,
        label: Type.String({
          title: "Status label",
          pattern: TRIMMED_STRING_OR_EMPTY_REGEX,
          errorMessage: {
            pattern: "cannot have leading/trailing spaces",
          },
        }),
      }),
      {
        title: "Status labels",
        description:
          "Customise the labels shown for each status. These are computed automatically from the dates entered on each item.",
        format: "date-filter-status-labels",
        minItems: 3,
        maxItems: 3,
      },
    ),
    // Optional for backward compatibility. Missing/`undefined` is read as
    // `DEFAULT_DATE_RANGE_FILTER_LABEL` at render time — omit JSON Schema
    // `default` for the same reason as `isRequired` above.
    dateRangeFilterLabel: Type.Optional(
      Type.String({
        title: "Custom date range label",
        description:
          "Label shown above the custom date range input in the filter sidebar.",
        pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
        errorMessage: {
          pattern: "cannot be empty or have leading/trailing spaces",
        },
      }),
    ),
    // Hidden toggles default true at render time via
    // `DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY` — omit JSON Schema `default` for
    // the same Studio AJV useDefaults reason as `isRequired` above.
    showStatusLabels: Type.Optional(
      Type.Boolean({
        title: "Show status labels filter",
        description:
          "Let visitors filter by status labels (e.g. Upcoming, Ongoing, Ended).",
        format: "hidden",
      }),
    ),
    showDateRange: Type.Optional(
      Type.Boolean({
        title: "Show date range filter",
        description: "Let visitors filter by a custom date range.",
        format: "hidden",
      }),
    ),
  },
  { title: "Date filter" },
)

export type TextFilterSchemaType = Static<typeof TextFilterSchema>
export type DateFilterSchemaType = Static<typeof DateFilterSchema>

export type DateFilterSidebarVisibility = Pick<
  DateFilterSchemaType,
  "showStatusLabels" | "showDateRange"
>

export const isDateFilter = (
  tagCategory: TextFilterSchemaType | DateFilterSchemaType,
): tagCategory is DateFilterSchemaType =>
  tagCategory.type === TAG_CATEGORY_TYPE.Date

export const isTextFilter = (
  tagCategory: TextFilterSchemaType | DateFilterSchemaType,
): tagCategory is TextFilterSchemaType => !isDateFilter(tagCategory)

// A real `oneOf` union rather than a flat object with every field optional:
// each filter type only ever carries the fields that are meaningful for it
// (a date filter genuinely has no `display`/`options`, not just a hidden
// one). The dedicated `"tag-category-item"` format lets a custom Studio
// control (JsonFormsTagCategoryItemControl) dispatch straight to whichever
// branch already matches the data — bypassing JSONForms' generic `oneOf`
// renderer, which would otherwise show an always-visible "Variant" picker
// the admin has no reason to see (the type was already decided by the
// type-choice modal on creation). `oneOf` order is load-bearing: index 0 is
// text, index 1 is date — JsonFormsTagCategoryItemControl indexes into this
// same array via JSONForms' own `indexOfFittingSchema`.
const TagCategorySchema = Type.Unsafe<
  TextFilterSchemaType | DateFilterSchemaType
>({
  oneOf: [TextFilterSchema, DateFilterSchema],
  format: "tag-category-item",
})
// NOTE: can be optional because the categories might not exist
const TagCategoriesSchema = Type.Object({
  tagCategories: Type.Optional(
    Type.Array(TagCategorySchema, {
      title: "Filters",
      description:
        "Add filters so visitors can find what they need. Editors can assign these options on items they create.",
      format: "tag-categories",
    }),
  ),
})

const TaggedSchema = Type.Optional(
  // NOTE: This stores the `uuid` of the tag option
  Type.Array(TagOptionUuidSchema, {
    // NOTE: we need a custom format because this cannot just be a simple drop down
    // as we need to reference the existing data that is pointing to this
    format: "tagged",
  }),
)

// NOTE: one entry per date-type `tagCategories` filter the item has a value
// for — `id` references that filter's `id` (distinct from `tagged`, which is
// a flat list of *option* ids since text filters have no per-item value
// shape to key by; a date filter's per-item value is data the editor typed
// in, not a selection from a list, so each entry needs to carry both the
// key and the value together). `endDate` present = the item picked a range;
// absent = a single date, treated as a 1-day event by status computation.
const DateTaggedSchema = Type.Optional(
  Type.Array(
    Type.Object({
      id: TagCategoryUuidSchema,
      date: Type.String({ format: "date" }),
      endDate: Type.Optional(Type.String({ format: "date" })),
    }),
    {
      description: "Pick a single date or a range.",
      format: "date-tagged",
    },
  ),
)

const categorySchemaObject = Type.Object({
  category: Type.String({
    title: "Article category",
    format: "hidden", // We will properly deprecate this key during the post-launch cleanup. Hiding it in Studio UI in the meantime.
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
  Type.Object({ dateTagged: DateTaggedSchema }),
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
  Type.Object({ dateTagged: DateTaggedSchema }),
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
      Type.String({
        title: "Sort items by",
        description: "This might take a while to reflect on the preview.",
        format: "collection-sort-order",
        default: "date-desc",
      }),
    ),
    // Deprecated, will be replaced with sortOrder above
    defaultSortBy: Type.Optional(
      Type.Union(
        [
          Type.Literal(COLLECTION_PAGE_SORT_BY.date, { title: "Date" }),
          Type.Literal(COLLECTION_PAGE_SORT_BY.title, { title: "Title" }),
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
    showThumbnail: Type.Optional(
      Type.Object(
        {
          fallback: Type.Union(
            [
              Type.Literal("logo", { title: "Use site logo" }),
              Type.Literal("first-image", {
                title: "Use first image on page, if available",
              }),
            ],
            {
              title: "If an item doesn’t have a thumbnail",
              format: ARRAY_RADIO_FORMAT,
              default: "logo",
            },
          ),
        },
        {
          title: "Display thumbnail on all items",
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

// NOTE: derived from `tagCategories` + `tagged` at render time (see
// `getPillAndPlaintextTags`), not a JSON schema field itself. `id` is the tag
// category's uuid, used as a stable React key — optional since the legacy
// `tags` fallback predates tag category uuids.
export interface TagGroup {
  id?: string
  category: string
  selected: string[]
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
