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
