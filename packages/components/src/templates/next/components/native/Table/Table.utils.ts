// Mirrors DEFAULT_TABLE_CAPTION / LEGACY_DEFAULT_TABLE_CAPTION in Studio's TableCaption/utils.ts.
// Can't import across the Studio/components boundary, so these must be kept in sync manually.
export const PLACEHOLDER_TABLE_CAPTIONS = new Set([
  "",
  "Table caption",
  "Table caption is required",
])

/** Returns the caption to render on published sites, or null for placeholders. */
export const getPublishedTableCaption = (caption: string): string | null => {
  const trimmed = caption.trim()
  return PLACEHOLDER_TABLE_CAPTIONS.has(trimmed) ? null : trimmed
}
