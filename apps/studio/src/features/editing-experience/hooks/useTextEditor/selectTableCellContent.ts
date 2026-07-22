import type { Editor } from "@tiptap/react"
import { TableCell, TableHeader } from "@tiptap/extension-table"
import { TextSelection } from "@tiptap/pm/state"

const TABLE_CELL_NODE_NAMES = new Set([TableCell.name, TableHeader.name])

/** Select all text in the table cell (or header) that contains the caret. */
export const selectTableCellContent = (editor: Editor): boolean => {
  const { state } = editor
  const { $from } = state.selection

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (!TABLE_CELL_NODE_NAMES.has(node.type.name)) {
      continue
    }

    // start/end may land on node boundaries; between() snaps to a valid inline range.
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
