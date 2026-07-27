export const PLACEHOLDER_TABLE_CAPTIONS = new Set([
  "",
  "Table caption",
  "Table caption is required",
])

/** Returns the caption to render on published sites, or null for placeholders. */
export const getPublishedTableCaption = (caption: string): string | null =>
  PLACEHOLDER_TABLE_CAPTIONS.has(caption.trim()) ? null : caption
