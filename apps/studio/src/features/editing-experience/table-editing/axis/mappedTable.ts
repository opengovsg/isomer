import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { TableMap } from "@tiptap/pm/tables"
import { TableMap as TableMapClass } from "@tiptap/pm/tables"

/** Table node plus its cell map for inspection without a live EditorView. */
export interface MappedTable {
  map: Pick<TableMap, "width" | "height" | "map">
  table: ProseMirrorNode
}

export const toMappedTable = (table: ProseMirrorNode): MappedTable => ({
  map: TableMapClass.get(table),
  table,
})

/** Resolves the table at `tablePos`, or null when the position moved on. */
export const getTableAt = (
  doc: ProseMirrorNode,
  tablePos: number,
): ProseMirrorNode | null => {
  const table = doc.nodeAt(tablePos)
  return table && table.type.name === "table" ? table : null
}
