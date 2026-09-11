import type { Editor } from "@tiptap/react"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Table } from "@tiptap/extension-table"

/** Remove an empty textblock when Backspace cannot join backward into a table. */
export const deleteEmptyTextblockBeforeTable = (editor: Editor): boolean => {
  const { state } = editor
  const { empty, $anchor } = state.selection

  if (!empty) {
    return false
  }

  const parent = $anchor.parent
  if (parent.type.name !== Paragraph.name || parent.content.size > 0) {
    return false
  }

  const parentDepth = $anchor.depth - 1
  const index = $anchor.index(parentDepth)

  // Only take over when Backspace has nowhere to join backward into. Otherwise
  // defer to the default chain so the caret stays in the preceding block.
  if (index > 0) {
    return false
  }

  const nextSibling = $anchor.node(parentDepth).maybeChild(index + 1)

  if (nextSibling?.type.name !== Table.name) {
    return false
  }

  return editor.commands.deleteCurrentNode()
}
