import type { Node } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import { CellSelection } from "@tiptap/pm/tables"

interface CellAtPosition {
  pos: number
  node: Node
}

// A table cell node wraps its editable blocks; these are the document
// positions of everything inside that wrapper (paragraphs, lists, etc.).
const innerContentRangeOfCell = ({
  cellPos,
  cell,
}: {
  cellPos: number
  cell: Node
}): { from: number; to: number } => ({
  from: cellPos + 1,
  to: cellPos + cell.nodeSize - 1,
})

const collectCellsInSelection = ({
  selection,
}: {
  selection: CellSelection
}): CellAtPosition[] => {
  const cells: CellAtPosition[] = []
  selection.forEachCell((node, pos) => {
    cells.push({ pos, node })
  })
  return cells
}

const replaceCellInnerContent = ({
  tr,
  cell,
  replacement,
}: {
  tr: Transaction
  cell: CellAtPosition
  replacement: Node
}): void => {
  const { from, to } = innerContentRangeOfCell({
    cellPos: cell.pos,
    cell: cell.node,
  })
  tr.replaceWith(from, to, replacement)
}

// Each replacement shortens/lengthens the doc, so later cell positions shift.
// Clear from the end first so untouched cells keep stable positions.
const clearCellContentsInReverseDocumentOrder = ({
  tr,
  cells,
  emptyParagraph,
}: {
  tr: Transaction
  cells: CellAtPosition[]
  emptyParagraph: Node
}): void => {
  const cellsFromEndToStart = [...cells].sort((a, b) => b.pos - a.pos)
  for (const cell of cellsFromEndToStart) {
    replaceCellInnerContent({ tr, cell, replacement: emptyParagraph })
  }
}

// Map the pre-clear anchor/head through the transaction so the same block
// stays selected after the menu action.
const restoreCellSelection = ({
  tr,
  selection,
}: {
  tr: Transaction
  selection: CellSelection
}): void => {
  const anchor = tr.mapping.map(selection.$anchorCell.pos)
  const head = tr.mapping.map(selection.$headCell.pos)
  tr.setSelection(CellSelection.create(tr.doc, anchor, head))
}

// Replace every selected cell's inner content with a single empty paragraph.
// Cell type (header vs body) and colspan/rowspan are preserved.
export const clearSelectedCells = ({ editor }: { editor: Editor }): void => {
  const { state, view } = editor
  const { selection, schema } = state
  if (!(selection instanceof CellSelection)) return

  const paragraph = schema.nodes.paragraph
  if (!paragraph) return

  const cells = collectCellsInSelection({ selection })
  if (cells.length === 0) return

  const tr = state.tr
  clearCellContentsInReverseDocumentOrder({
    tr,
    cells,
    emptyParagraph: paragraph.create(),
  })
  restoreCellSelection({ tr, selection })
  view.dispatch(tr)
}
