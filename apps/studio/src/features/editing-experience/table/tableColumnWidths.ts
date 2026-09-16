import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { TableMap } from "@tiptap/pm/tables"

export {
  buildColgroupSpec,
  getEqualColumnWidths,
  resolveColumnWidths,
} from "@opengovsg/isomer-components"

// prosemirror-tables default. See rte-table-ux/issues/13-grilling-column-width-ux-details.md.
export const MIN_COLUMN_WIDTH_PX = 25

export const getColumnCount = (node: ProseMirrorNode): number =>
  node.firstChild ? TableMap.get(node).width : 0

// Handle at columnIndex moves width only between that column and columnIndex + 1.
// Caller must ensure columnIndex + 1 < widths.length.
export const redistributeOnResize = ({
  widths,
  columnIndex,
  deltaPercent,
  minPercent,
}: {
  widths: number[]
  columnIndex: number
  deltaPercent: number
  minPercent: number
}): number[] => {
  const neighborIndex = columnIndex + 1
  const currentWidth = widths[columnIndex] ?? 0
  const neighborWidth = widths[neighborIndex] ?? 0
  const combinedWidth = currentWidth + neighborWidth
  // When the pair is narrower than 2 * minPercent, min and max invert; fall back to [0, combinedWidth].
  const minBound = Math.max(0, Math.min(minPercent, combinedWidth - minPercent))
  const maxBound = Math.min(
    combinedWidth,
    Math.max(minPercent, combinedWidth - minPercent),
  )

  // Keep targetWidth within [minBound, maxBound].
  const targetWidth = Math.min(
    Math.max(currentWidth + deltaPercent, minBound),
    maxBound,
  )

  const result = [...widths]
  result[columnIndex] = targetWidth
  result[neighborIndex] = combinedWidth - targetWidth
  return result
}
