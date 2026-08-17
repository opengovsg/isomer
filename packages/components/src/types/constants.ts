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

export const DEFAULT_TAG_CATEGORY_TYPE = TAG_CATEGORY_TYPE.Text

export const resolveTagCategoryType = (
  type?: TagCategoryType,
): TagCategoryType => type ?? DEFAULT_TAG_CATEGORY_TYPE

export const isDateCategoryType = (
  type?: TagCategoryType,
): type is typeof TAG_CATEGORY_TYPE.Date =>
  resolveTagCategoryType(type) === TAG_CATEGORY_TYPE.Date

export const DATE_FILTER_STATUS_ID = {
  Ended: "ENDED",
  Ongoing: "ONGOING",
  Upcoming: "UPCOMING",
} as const

export type DateFilterStatusId =
  (typeof DATE_FILTER_STATUS_ID)[keyof typeof DATE_FILTER_STATUS_ID]

export const DEFAULT_DATE_FILTER_STATUS_LABELS: Record<
  DateFilterStatusId,
  string
> = {
  [DATE_FILTER_STATUS_ID.Ended]: "Event ended",
  [DATE_FILTER_STATUS_ID.Ongoing]: "Ongoing",
  [DATE_FILTER_STATUS_ID.Upcoming]: "Upcoming",
}

export const DEFAULT_DATE_RANGE_FILTER_LABEL = "Or, search for a date"
