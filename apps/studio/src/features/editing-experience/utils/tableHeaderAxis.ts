import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { TableMap } from "@tiptap/pm/tables"

/**
 * Whether a table has a header row or a header column. The bubble menu uses it
 * to withhold destructive actions that overlap a header; the drag handles use
 * it to lock a header axis against reordering.
 */

/**
 * A table node paired with its cell map — the structural slice needed to
 * inspect a table's cells without a live EditorView.
 */
export interface MappedTable {
  map: Pick<TableMap, "width" | "height" | "map">
  table: ProseMirrorNode
}

const cellTypeAt = (
  mapped: MappedTable,
  row: number,
  col: number,
): string | null => {
  const cellPos = mapped.map.map[row * mapped.map.width + col]
  if (cellPos === undefined) return null
  return mapped.table.nodeAt(cellPos)?.type.name ?? null
}

/** True when every cell in the top row is a header cell. */
export const hasHeaderRow = (mapped: MappedTable): boolean => {
  for (let col = 0; col < mapped.map.width; col++) {
    if (cellTypeAt(mapped, 0, col) !== "tableHeader") return false
  }
  return mapped.map.width > 0
}

/** True when every cell in the leftmost column is a header cell. */
export const hasHeaderColumn = (mapped: MappedTable): boolean => {
  for (let row = 0; row < mapped.map.height; row++) {
    if (cellTypeAt(mapped, row, 0) !== "tableHeader") return false
  }
  return mapped.map.height > 0
}
