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

export const DEFAULT_TAG_CATEGORY_IS_REQUIRED = true

// Schema marks `display` / `isRequired` required for Studio JsonForms, but legacy
// published blobs may still omit them. Normalize at runtime/publish read paths
export const resolveTagCategoryDisplay = (
  display?: TagCategoryDisplay,
): TagCategoryDisplay => display ?? DEFAULT_TAG_CATEGORY_DISPLAY

export const resolveTagCategoryIsRequired = (isRequired?: boolean): boolean =>
  isRequired ?? DEFAULT_TAG_CATEGORY_IS_REQUIRED
