import type { Editor } from "@tiptap/react"
import type { TableCommandOutcome } from "~/lib/analytics/tables"
import { CellSelection, deleteCellSelection } from "@tiptap/pm/tables"

export const clearSelectedCells = (editor: Editor): TableCommandOutcome => {
  const { state, view } = editor
  const { selection } = state
  if (!(selection instanceof CellSelection)) return "skipped"

  const cleared = deleteCellSelection(state, (tr) => {
    const anchor = tr.mapping.map(selection.$anchorCell.pos)
    const head = tr.mapping.map(selection.$headCell.pos)
    view.dispatch(tr.setSelection(CellSelection.create(tr.doc, anchor, head)))
  })
  return cleared ? "applied" : "rejected"
}
