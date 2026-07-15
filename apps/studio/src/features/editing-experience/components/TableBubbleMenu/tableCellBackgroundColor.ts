import type { TableCellBackgroundColorToken } from "@opengovsg/isomer-components"
import type { Editor } from "@tiptap/react"
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

export const getUniformBodyCellBackgroundColor = (
  selection: CellSelection,
): TableCellBackgroundColorToken | null | "mixed" => {
  let color: TableCellBackgroundColorToken | null | undefined
  let isMixed = false

  selection.forEachCell((node) => {
    if (node.type.name !== "tableCell" || isMixed) return

    const cellColor = node.attrs
      .backgroundColor as TableCellBackgroundColorToken | null
    if (color === undefined) {
      color = cellColor
    } else if (color !== cellColor) {
      isMixed = true
    }
  })

  return isMixed ? "mixed" : (color ?? null)
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

    transaction.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      backgroundColor: color,
    })
  })

  if (transaction.docChanged) {
    editor.view.dispatch(transaction)
  }
}
