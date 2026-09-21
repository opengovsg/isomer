export const ISOMER_USABLE_PAGE_LAYOUTS = {
  Article: "article",
  Collection: "collection",
  Content: "content",
  Homepage: "homepage",
  Index: "index",
  Database: "database",
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

// Default for new filters in Studio (`createDefaultTagCategory`), not for legacy blobs.
export const DEFAULT_TAG_CATEGORY_IS_REQUIRED = true

// Published blobs may omit `display` / `isRequired`. Call these when reading for
// render or publish.
export const resolveTagCategoryDisplay = (
  display?: TagCategoryDisplay,
): TagCategoryDisplay => display ?? DEFAULT_TAG_CATEGORY_DISPLAY

export const resolveTagCategoryIsRequired = (isRequired?: boolean): boolean =>
  isRequired === true
