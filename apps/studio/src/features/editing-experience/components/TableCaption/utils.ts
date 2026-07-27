export const CAPTION_MAX_LENGTH = 200

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

/** Blank out placeholder defaults when opening the caption editor. */
export const normalizeTableCaptionForEdit = (caption: string): string =>
  isPlaceholderTableCaption(caption) ? "" : caption

/** Caption text shown inline in the editor for placeholder and real values. */
export const getDisplayTableCaption = (caption: string): string => {
  if (!isPlaceholderTableCaption(caption)) return caption

  const trimmed = caption.trim()
  return trimmed === "" ? DEFAULT_TABLE_CAPTION : trimmed
}

/**
 * Clamp caption input to the configured max length.
 */
export const clampCaptionLength = (value: string): string =>
  value.slice(0, CAPTION_MAX_LENGTH)

/**
 * Value to persist when the caption field blurs / commits.
 * Empty (after trim) captions are not persisted — restore the baseline
 * captured when focus began.
 */
export const resolveCaptionOnBlur = (
  draft: string,
  baseline: string,
): string => {
  const trimmed = draft.trim()
  return trimmed ? trimmed : baseline
}
