import type { Editor } from "@tiptap/react"
import {
  isTableCellBackgroundColorToken,
  type TableCellBackgroundColorToken,
} from "@opengovsg/isomer-components"
import { CellSelection } from "@tiptap/pm/tables"

export const selectionHasBodyCell = (selection: CellSelection): boolean => {
  let hasBodyCell = false

  selection.forEachCell((node) => {
    if (node.type.name === "tableCell") {
      hasBodyCell = true
    }
  })

  return hasBodyCell
}

// Shared token when every selected body cell agrees; otherwise null (cleared
// or mixed). The colour panel only highlights a swatch on a uniform token.
export const getUniformBodyCellBackgroundColor = (
  selection: CellSelection,
): TableCellBackgroundColorToken | null => {
  let seen = false
  let color: TableCellBackgroundColorToken | null = null
  let isMixed = false

  selection.forEachCell((node) => {
    if (node.type.name !== "tableCell" || isMixed) return

    const cellColor = isTableCellBackgroundColorToken(
      node.attrs.backgroundColor,
    )
      ? node.attrs.backgroundColor
      : null

    if (!seen) {
      seen = true
      color = cellColor
      return
    }

    if (color !== cellColor) {
      isMixed = true
      color = null
    }
  })

  return color
}

export const setSelectedBodyCellsBackgroundColor = (
  editor: Editor,
  color: TableCellBackgroundColorToken | null,
): void => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return

  const transaction = editor.state.tr
  selection.forEachCell((node, pos) => {
    if (node.type.name !== "tableCell") return
    if (node.attrs.backgroundColor === color) return

    transaction.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      backgroundColor: color,
    })
  })

  if (transaction.docChanged) {
    editor.view.dispatch(transaction)
  }
}
