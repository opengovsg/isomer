export const MAX_CAPTION_LENGTH = 200

/** Default caption written onto new tables until the author adds a real one. */
export const DEFAULT_TABLE_CAPTION = "Table caption is required"

/** Legacy default kept so older documents still show "Add caption". */
export const LEGACY_DEFAULT_TABLE_CAPTION = "Table caption"

export const isPlaceholderTableCaption = (caption: string): boolean => {
  const trimmed = caption.trim()
  return (
    trimmed === "" ||
    trimmed === DEFAULT_TABLE_CAPTION ||
    trimmed === LEGACY_DEFAULT_TABLE_CAPTION
  )
}
