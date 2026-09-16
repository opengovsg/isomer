import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { TableMap } from "@tiptap/pm/tables"
import { TableMap as TableMapClass } from "@tiptap/pm/tables"

/** Table node plus TableMap for checks that do not need EditorView. */
export interface MappedTable {
  map: Pick<TableMap, "width" | "height" | "map">
  table: ProseMirrorNode
}

export const toMappedTable = (table: ProseMirrorNode): MappedTable => ({
  map: TableMapClass.get(table),
  table,
})

/** Table node at tablePos, or null if that position is not a table. */
export const getTableAt = (
  doc: ProseMirrorNode,
  tablePos: number,
): ProseMirrorNode | null => {
  const table = doc.nodeAt(tablePos)
  return table && table.type.name === "table" ? table : null
}
