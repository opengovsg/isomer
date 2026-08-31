import type { Editor } from "@tiptap/react"
import { CellSelection, deleteCellSelection } from "@tiptap/pm/tables"

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
