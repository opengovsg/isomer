import type { Node } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import { CellSelection } from "@tiptap/pm/tables"

interface ResolvedCell {
  pos: number
  node: Node
}

/** Document positions of a cell's inner content (excludes the cell node itself). */
const cellContentRange = (cellPos: number, cell: Node) => ({
  from: cellPos + 1,
  to: cellPos + cell.nodeSize - 1,
})

const collectSelectedCells = (selection: CellSelection): ResolvedCell[] => {
  const cells: ResolvedCell[] = []
  selection.forEachCell((node, pos) => {
    cells.push({ pos, node })
  })
  return cells
}

const restoreCellSelection = (
  tr: Transaction,
  selection: CellSelection,
): Transaction => {
  const anchor = tr.mapping.map(selection.$anchorCell.pos)
  const head = tr.mapping.map(selection.$headCell.pos)
  return tr.setSelection(CellSelection.create(tr.doc, anchor, head))
}

/**
 * Replace every selected cell's inner content with a single empty paragraph.
 * Cell type (header vs body) and colspan/rowspan are preserved.
 */
export const clearSelectedCells = (editor: Editor): void => {
  const { state, view } = editor
  const { selection, schema } = state
  if (!(selection instanceof CellSelection)) return

  const paragraph = schema.nodes.paragraph
  if (!paragraph) return

  const emptyParagraph = paragraph.create()
  const cells = collectSelectedCells(selection)
  if (cells.length === 0) return

  let tr = state.tr
  // Replace from the end so earlier cell positions stay valid.
  for (const cell of cells.sort((a, b) => b.pos - a.pos)) {
    const { from, to } = cellContentRange(cell.pos, cell.node)
    tr = tr.replaceWith(from, to, emptyParagraph)
  }

  view.dispatch(restoreCellSelection(tr, selection))
}
