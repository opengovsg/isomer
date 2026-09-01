import type { Editor } from "@tiptap/react"
import {
  isTableCellBackgroundColorToken,
  type TableCellBackgroundColorToken,
} from "@opengovsg/isomer-components"
import { CellSelection } from "@tiptap/pm/tables"

export interface SelectionBackgroundColorState {
  /** False when selected cells do not all share the same background token. */
  isUniform: boolean
  /** Shared token when `isUniform`; otherwise null (do not treat as “None”). */
  uniformColor: TableCellBackgroundColorToken | null
}

/** One CellSelection walk for uniform token detection. */
export const getSelectionBackgroundColorState = (
  selection: CellSelection,
): SelectionBackgroundColorState => {
  let seenColor = false
  let isUniform = true
  let uniformColor: TableCellBackgroundColorToken | null = null

  selection.forEachCell((node) => {
    if (seenColor && !isUniform) return

    const cellColor = isTableCellBackgroundColorToken(
      node.attrs.backgroundColor,
    )
      ? node.attrs.backgroundColor
      : null

    if (!seenColor) {
      seenColor = true
      uniformColor = cellColor
      return
    }

    if (uniformColor !== cellColor) {
      isUniform = false
      uniformColor = null
    }
  })

  return {
    isUniform,
    uniformColor,
  }
}

export const setSelectedCellsBackgroundColor = (
  editor: Editor,
  color: TableCellBackgroundColorToken | null,
): void => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return
  if (color !== null && !isTableCellBackgroundColorToken(color)) return

  const transaction = editor.state.tr
  selection.forEachCell((node, pos) => {
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
