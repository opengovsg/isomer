export const ISOMER_USABLE_PAGE_LAYOUTS = {
  Article: "article",
  Collection: "collection",
  Content: "content",
  Homepage: "homepage",
  Index: "index",
  Database: "database",
  File: "file",
  Link: "link",
} as const

export const ISOMER_PAGE_LAYOUTS = {
  ...ISOMER_USABLE_PAGE_LAYOUTS,
  NotFound: "notfound",
  Search: "search",
} as const

export const TAG_CATEGORY_DISPLAY_OPTIONS = {
  Pills: "pills",
  Plaintext: "plaintext",
} as const

export type TagCategoryDisplay =
  (typeof TAG_CATEGORY_DISPLAY_OPTIONS)[keyof typeof TAG_CATEGORY_DISPLAY_OPTIONS]

export const DEFAULT_TAG_CATEGORY_DISPLAY = TAG_CATEGORY_DISPLAY_OPTIONS.Pills

// Legacy persisted `tagCategories` may omit `display` (pre image-radio rollout). Read
// missing/`undefined` as `DEFAULT_TAG_CATEGORY_DISPLAY` at render time — we cannot rely
// on JSON Schema `default` because Studio AJV runs with useDefaults, which would
// backfill legacy rows when editors open them. After a forward migration populates
// `display` on all blobs, make the schema field required and delete this helper.
export const resolveTagCategoryDisplay = (
  display?: TagCategoryDisplay,
): TagCategoryDisplay => display ?? DEFAULT_TAG_CATEGORY_DISPLAY

// tagCategories entry is "text" (option list) or "date" (status buckets).
export const TAG_CATEGORY_TYPE = {
  Text: "text",
  Date: "date",
} as const

export type TagCategoryType =
  (typeof TAG_CATEGORY_TYPE)[keyof typeof TAG_CATEGORY_TYPE]
export type TagCategoryDateType = (typeof TAG_CATEGORY_TYPE)["Date"]

export const DATE_FILTER_STATUS = {
  Ended: {
    id: "ENDED",
    defaultLabel: "Event ended",
  },
  Ongoing: {
    id: "ONGOING",
    defaultLabel: "Ongoing",
  },
  Upcoming: {
    id: "UPCOMING",
    defaultLabel: "Upcoming",
  },
} as const

export type DateFilterStatusId =
  (typeof DATE_FILTER_STATUS)[keyof typeof DATE_FILTER_STATUS]["id"]

export const DEFAULT_DATE_FILTER_STATUS_LABELS = {
  [DATE_FILTER_STATUS.Ended.id]: DATE_FILTER_STATUS.Ended.defaultLabel,
  [DATE_FILTER_STATUS.Ongoing.id]: DATE_FILTER_STATUS.Ongoing.defaultLabel,
  [DATE_FILTER_STATUS.Upcoming.id]: DATE_FILTER_STATUS.Upcoming.defaultLabel,
} as const satisfies Record<DateFilterStatusId, string>

export const DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY = {
  showStatusLabelsFilter: true,
  showDateRangeFilter: true,
} as const

export const COLLECTION_SORT_ORDER = {
  DateDesc: "date-desc",
  DateAsc: "date-asc",
  TitleAsc: "title-asc",
  TitleDesc: "title-desc",
} as const

export type CollectionSortOrder =
  (typeof COLLECTION_SORT_ORDER)[keyof typeof COLLECTION_SORT_ORDER]

export const DEFAULT_COLLECTION_SORT_ORDER = COLLECTION_SORT_ORDER.DateDesc
