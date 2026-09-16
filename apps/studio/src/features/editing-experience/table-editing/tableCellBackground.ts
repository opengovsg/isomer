import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorState, Transaction } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import {
  getTableCellBackgroundColorCss,
  isTableCellBackgroundColorToken,
  type TableCellBackgroundColorToken,
} from "@opengovsg/isomer-components"
import { CellSelection } from "@tiptap/pm/tables"

interface TableCellSnapshot {
  pos: number
  type: string
  backgroundColor: unknown
}

interface HeaderToggleProps {
  state: EditorState
  tr: Transaction
}

export type HeaderToggleCommand = (props: HeaderToggleProps) => boolean

export const tableCellBackgroundColorAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => {
    const value = element.getAttribute("data-background-color")
    return isTableCellBackgroundColorToken(value) ? value : null
  },
  renderHTML: (attributes: Record<string, unknown>) => {
    const css = getTableCellBackgroundColorCss(attributes.backgroundColor)
    if (!css || !isTableCellBackgroundColorToken(attributes.backgroundColor)) {
      return {}
    }

    return {
      "data-background-color": attributes.backgroundColor,
      style: `background-color: ${css}`,
    }
  },
}

const getTableCellsInOrder = (doc: ProseMirrorNode): TableCellSnapshot[] => {
  const cells: TableCellSnapshot[] = []
  doc.descendants((node, pos) => {
    if (node.type.name !== "tableCell" && node.type.name !== "tableHeader") {
      return true
    }

    cells.push({
      pos,
      type: node.type.name,
      backgroundColor: node.attrs.backgroundColor,
    })
    return false
  })
  return cells
}

/** Clears backgroundColor on cells whose kind changed within the same transaction. */
export const appendClearBackgroundOnCellKindChange = (
  beforeDoc: ProseMirrorNode,
  transaction: Transaction,
) => {
  const beforeCells = getTableCellsInOrder(beforeDoc)
  const afterCells = getTableCellsInOrder(transaction.doc)

  const positionsToClear = afterCells.flatMap((after, index) => {
    const before = beforeCells[index]
    if (
      !before ||
      before.type === after.type ||
      after.backgroundColor == null
    ) {
      return []
    }
    return [after.pos]
  })

  for (const pos of positionsToClear.sort((left, right) => right - left)) {
    const node = transaction.doc.nodeAt(pos)
    if (!node) continue

    transaction.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      backgroundColor: null,
    })
  }
}

export const wrapHeaderToggleCommand =
  (parentCommand: HeaderToggleCommand | undefined) =>
  () =>
  (props: HeaderToggleProps) => {
    const beforeDoc = props.state.doc
    const result = parentCommand?.(props) ?? false
    if (!result) return false
    appendClearBackgroundOnCellKindChange(beforeDoc, props.tr)
    return true
  }

export const getSelectionBackgroundColorState = (selection: CellSelection) => {
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
