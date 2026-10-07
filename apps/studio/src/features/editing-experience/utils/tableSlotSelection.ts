import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { CellSelection, TableMap } from "@tiptap/pm/tables"

interface SlotRect {
  top: number
  bottom: number
  left: number
  right: number
  map: TableMap
}

// A rowspan that sticks out of the clicked row cannot be a selection corner.
// CellSelection's rectangle is the bounding box of those corners, so a cell in
// column 0 that spans the table selects every row.
const cellOffsetFittingRow = (
  map: TableMap,
  row: number,
  col: number,
): number | null => {
  const pos = map.map[row * map.width + col]
  if (pos === undefined) return null
  const cellRect = map.findCell(pos)
  if (cellRect.top !== row || cellRect.bottom !== row + 1) return null
  return pos
}

/** Cell selection for one row, ignoring vertical spans that leave that row. */
export const selectionForRowSlot = (
  doc: ProseMirrorNode,
  tablePos: number,
  row: number,
): CellSelection | null => {
  const table = doc.nodeAt(tablePos)
  if (!table || table.type.name !== "table") return null
  const map = TableMap.get(table)
  let anchor: number | null = null
  let head: number | null = null
  for (let col = 0; col < map.width; col++) {
    const pos = cellOffsetFittingRow(map, row, col)
    if (pos === null) continue
    anchor ??= pos
    head = pos
  }
  if (anchor === null || head === null) return null
  return CellSelection.create(doc, tablePos + 1 + anchor, tablePos + 1 + head)
}

/**
 * True when the rect is one row and every column it misses is covered by a
 * vertical span. Those spans cannot sit inside a one-row rectangle, so the
 * rect is still that row.
 */
export const isRowSlotClippedByVerticalSpan = (rect: SlotRect): boolean => {
  if (rect.bottom !== rect.top + 1) return false
  if (rect.left === 0 && rect.right === rect.map.width) return false
  if (rect.left >= rect.right) return false
  for (let col = 0; col < rect.map.width; col++) {
    if (col >= rect.left && col < rect.right) continue
    if (cellOffsetFittingRow(rect.map, rect.top, col) !== null) return false
  }
  return true
}
