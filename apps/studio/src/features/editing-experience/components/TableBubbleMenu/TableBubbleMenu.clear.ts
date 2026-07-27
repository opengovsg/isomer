import type { Node } from "@tiptap/pm/model"
import type { Editor } from "@tiptap/react"
import { CellSelection } from "@tiptap/pm/tables"

// Replace every selected cell's inner content with a single empty paragraph.
// Cell type (header vs body) and colspan/rowspan are preserved.
export const clearSelectedCells = (editor: Editor): void => {
  const { state, view } = editor
  const { selection, schema } = state
  if (!(selection instanceof CellSelection)) return

  const paragraph = schema.nodes.paragraph
  if (!paragraph) return

  const emptyParagraph = paragraph.create()
  const cells: { pos: number; node: Node }[] = []
  selection.forEachCell((node, pos) => {
    cells.push({ pos, node })
  })

  if (cells.length === 0) return

  const tr = state.tr
  // Replace from the end so earlier cell positions stay valid.
  cells.sort((a, b) => b.pos - a.pos)
  for (const { pos, node } of cells) {
    const innerStart = pos + 1
    const innerEnd = pos + node.nodeSize - 1
    tr.replaceWith(innerStart, innerEnd, emptyParagraph)
  }

  const anchor = tr.mapping.map(selection.$anchorCell.pos)
  const head = tr.mapping.map(selection.$headCell.pos)
  tr.setSelection(CellSelection.create(tr.doc, anchor, head))
  view.dispatch(tr)
}
