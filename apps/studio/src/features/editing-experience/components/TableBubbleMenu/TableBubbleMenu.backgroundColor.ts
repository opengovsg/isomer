import type { Editor } from "@tiptap/react"
import {
  isTableCellBackgroundColorToken,
  isTableCellBrandBackgroundColorToken,
  type TableCellBackgroundColorToken,
} from "@opengovsg/isomer-components"
import { CellSelection } from "@tiptap/pm/tables"

export interface SelectionBackgroundColorState {
  canSet: boolean
  isHeaderOnly: boolean
  /** False when selected cells do not all share the same background token. */
  isUniform: boolean
  /** Shared token when `isUniform`; otherwise null (do not treat as “None”). */
  uniformColor: TableCellBackgroundColorToken | null
}

/** One CellSelection walk: mixed gate, header-only flag, and uniform token. */
export const getSelectionBackgroundColorState = (
  selection: CellSelection,
): SelectionBackgroundColorState => {
  let hasBodyCell = false
  let hasHeaderCell = false
  let seenColor = false
  let isUniform = true
  let uniformColor: TableCellBackgroundColorToken | null = null

  selection.forEachCell((node) => {
    if (node.type.name === "tableCell") {
      hasBodyCell = true
    } else if (node.type.name === "tableHeader") {
      hasHeaderCell = true
    }

    // Still walk every cell for header/body flags; skip further colour compares.
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
    canSet: !(hasHeaderCell && hasBodyCell),
    isHeaderOnly: hasHeaderCell && !hasBodyCell,
    isUniform,
    uniformColor,
  }
}

export const isBackgroundColorAllowedForSelection = (
  color: TableCellBackgroundColorToken | null,
  isHeaderSelection: boolean,
): boolean => {
  if (color === null) return true
  if (isHeaderSelection) {
    return isTableCellBrandBackgroundColorToken(color)
  }
  return (
    isTableCellBackgroundColorToken(color) &&
    !isTableCellBrandBackgroundColorToken(color)
  )
}

export const setSelectedCellsBackgroundColor = (
  editor: Editor,
  color: TableCellBackgroundColorToken | null,
): void => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return

  const state = getSelectionBackgroundColorState(selection)
  if (!state.canSet) return
  if (!isBackgroundColorAllowedForSelection(color, state.isHeaderOnly)) return

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
