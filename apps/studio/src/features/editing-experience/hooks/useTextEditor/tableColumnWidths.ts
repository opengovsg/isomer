import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { TableMap } from "@tiptap/pm/tables"

export {
  getEqualColumnWidths,
  resolveColumnWidths,
} from "@opengovsg/isomer-components"

// prosemirror-tables' own default minimum column width, kept as-is per the
// locked decision in rte-table-ux/issues/13-grilling-column-width-ux-details.md.
export const MIN_COLUMN_WIDTH_PX = 25

export const getColumnCount = (node: ProseMirrorNode): number =>
  node.firstChild ? TableMap.get(node).width : 0

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

// A resize handle sits at the boundary right after `columnIndex`, so it only
// ever transfers width between that column and its direct neighbour -- every
// other column is untouched. This is a simple zero-sum swap between the
// pair (their combined width never changes), unlike a model that
// redistributes the delta proportionally across every other column.
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

  const targetWidth = clamp(
    currentWidth + deltaPercent,
    minPercent,
    combinedWidth - minPercent,
  )

  const result = [...widths]
  result[columnIndex] = targetWidth
  result[neighborIndex] = combinedWidth - targetWidth
  return result
}
