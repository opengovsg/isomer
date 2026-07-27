<<<<<<< HEAD
=======
import type { Editor as TiptapEditor } from "@tiptap/react"
import { viewportPointToContainerPoint } from "~/features/editing-experience/utils/tableEditorGeometry"

>>>>>>> a708f6326 (fix(rte-table): isolate editor overlay coordinates)
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
<<<<<<< HEAD
=======

/**
 * Computes where to paint the caption overlay and how much top margin the
 * table needs so that space is reserved in the document flow.
 *
 * Coordinates are container-relative, including scroll offsets, so the
 * caption stays aligned as the editor scrolls.
 *
 * The caption's `top` is the table's margin-edge (border-box top minus the
 * margin currently applied). Anchoring there — instead of at
 * `borderBoxTop - newMarginTop` — keeps the input line stable when the
 * caption box grows or shrinks: extra height expands downward into the
 * reserved margin, and the table's margin is resized to match. Using the
 * new reserved height as the offset was the source of the "jumps up on
 * focus / overlaps the table on blur" bug when the character counter
 * toggled.
 */
export const computeCaptionLayout = ({
  tableRect,
  containerRect,
  scrollTop,
  scrollLeft,
  captionHeight,
  currentMarginTop,
  gapPx = CAPTION_TABLE_GAP_PX,
}: ComputeCaptionLayoutParams): CaptionLayout => {
  const marginTop = captionHeight + gapPx
  const tableOrigin = viewportPointToContainerPoint({
    clientX: tableRect.left,
    clientY: tableRect.top,
    containerRect,
    scrollTop,
    scrollLeft,
  })
  return {
    marginTop,
    rect: {
      top: tableOrigin.y - currentMarginTop,
      left: tableOrigin.x,
      width: tableRect.width,
    },
  }
}

/** Shallow equality for measured caption rects — avoids ResizeObserver feedback loops. */
export const captionRectsEqual = (
  a: CaptionLayoutRect | null,
  b: CaptionLayoutRect,
): boolean =>
  a !== null && a.top === b.top && a.left === b.left && a.width === b.width
>>>>>>> a708f6326 (fix(rte-table): isolate editor overlay coordinates)
