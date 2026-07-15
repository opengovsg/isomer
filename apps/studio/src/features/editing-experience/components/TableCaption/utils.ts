import type { Editor as TiptapEditor } from "@tiptap/react"
import { viewportPointToContainerPoint } from "~/features/editing-experience/utils/tableEditorGeometry"

export const CAPTION_MAX_LENGTH = 200
export const CAPTION_TABLE_GAP_PX = 8

export interface TableInstance {
  /** ProseMirror document position of the `table` node. */
  pos: number
  caption: string
}

export interface CaptionLayoutRect {
  top: number
  left: number
  width: number
}

export interface ComputeCaptionLayoutParams {
  tableRect: Pick<DOMRect, "top" | "left" | "width">
  containerRect: Pick<DOMRect, "top" | "left">
  scrollTop: number
  scrollLeft: number
  captionHeight: number
  /**
   * The table's currently applied top margin in px. `tableRect.top` is the
   * border-box top (so it already reflects this margin); subtracting it
   * recovers the margin-edge origin. Pass the margin that is on the table
   * *right now* — not the margin about to be written — otherwise the caption
   * jumps whenever its height changes (e.g. the focus character counter).
   */
  currentMarginTop: number
  gapPx?: number
}

/**
 * Absolute caption box position relative to a scrollable, positioned
 * container, plus the `marginTop` that should be applied on the table DOM
 * node so the caption reserves real layout space (and is not clipped when
 * the table is the first block in the document).
 */
export interface CaptionLayout {
  rect: CaptionLayoutRect
  /** Applied to the table DOM node so the caption does not paint outside the container. */
  marginTop: number
}

/**
 * Walks the document and returns the position + caption of every `table`
 * node, in document order. Scoping reads/writes to a specific table's `pos`
 * (rather than "whichever table is at the current selection") is what makes
 * this correct for documents containing more than one table.
 */
export const getTableInstances = (editor: TiptapEditor): TableInstance[] => {
  const instances: TableInstance[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "table") {
      instances.push({
        pos,
        caption: (node.attrs.caption as string | undefined) ?? "",
      })
      // Tables cannot be nested inside one another, so we don't need to
      // descend into this node's content to find more `table` nodes.
      return false
    }
    return true
  })
  return instances
}

/**
 * Writes `caption` onto the `table` node at `pos`, without touching the
 * editor's current selection. `editor.chain().updateAttributes('table', ...)`
 * is selection-scoped (it updates whichever table node the current selection
 * is inside), so it can't target an arbitrary table instance when a document
 * has more than one table. Instead we build a transaction directly with
 * `tr.setNodeMarkup`, which updates the node at an explicit document
 * position regardless of selection.
 */
export const setTableCaptionAtPos = (
  editor: TiptapEditor,
  pos: number,
  caption: string,
): void => {
  const node = editor.state.doc.nodeAt(pos)
  if (!node || node.type.name !== "table") return

  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    caption,
  })
  editor.view.dispatch(tr)
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
