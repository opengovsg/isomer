import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorState, Transaction } from "@tiptap/pm/state"

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
