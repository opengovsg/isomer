import type { Editor } from "@tiptap/react"
import { TextSelection } from "@tiptap/pm/state"

const TABLE_CELL_NODE_NAMES = new Set(["tableCell", "tableHeader"])

/**
 * Selects the text content of the table cell containing the current selection.
 * Returns false when the selection is not inside a table cell/header.
 */
export const selectTableCellContent = (editor: Editor): boolean => {
  const { state } = editor
  const { $from } = state.selection

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (!TABLE_CELL_NODE_NAMES.has(node.type.name)) {
      continue
    }

    // Cell content positions can sit on node boundaries; TextSelection.between
    // resolves them to the nearest valid inline range inside the cell.
    const selection = TextSelection.between(
      state.doc.resolve($from.start(depth)),
      state.doc.resolve($from.end(depth)),
    )

    return editor.commands.setTextSelection({
      from: selection.from,
      to: selection.to,
    })
  }

  return false
}
