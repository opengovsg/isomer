import type { Editor } from "@tiptap/react"
import { Table } from "@tiptap/extension-table"

/** Remove an empty textblock when Backspace cannot join backward into a table. */
export const deleteEmptyTextblockBeforeTable = (editor: Editor): boolean => {
  const { state } = editor
  const { empty, $anchor } = state.selection

  if (!empty) {
    return false
  }

  const parent = $anchor.parent
  if (!parent.type.isTextblock || parent.content.size > 0) {
    return false
  }

  const parentDepth = $anchor.depth - 1
  const nextSibling = $anchor
    .node(parentDepth)
    .maybeChild($anchor.index(parentDepth) + 1)

  if (nextSibling?.type.name !== Table.name) {
    return false
  }

  return editor.commands.deleteCurrentNode()
}
