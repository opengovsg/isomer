import type { Editor } from "@tiptap/react"
import { CellSelection, deleteCellSelection } from "@tiptap/pm/tables"

/**
 * Replace every selected cell's inner content with a single empty paragraph.
 * Cell type (header vs body) and colspan/rowspan are preserved.
 *
 * Delegates to prosemirror-tables' deleteCellSelection (also bound to
 * Backspace/Delete for CellSelection) and restores the cell selection
 * afterward so the bubble menu stays contextual.
 */
export const clearSelectedCells = (editor: Editor): void => {
  const { state, view } = editor
  const { selection } = state
  if (!(selection instanceof CellSelection)) return

  deleteCellSelection(state, (tr) => {
    const anchor = tr.mapping.map(selection.$anchorCell.pos)
    const head = tr.mapping.map(selection.$headCell.pos)
    view.dispatch(tr.setSelection(CellSelection.create(tr.doc, anchor, head)))
  })
}
