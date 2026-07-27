import type { Editor } from "@tiptap/react"
import type { TableBubbleMenuAnchor } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.types"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"

export const TABLE_EDITOR_OVERLAYS_ATTR = "data-table-editor-overlays"

const getTableEditorOverlays = (editor: Editor): HTMLElement | null =>
  editor.view.dom.closest(`[${TABLE_EDITOR_OVERLAYS_ATTR}]`)

const hasSingleHandleAnchorSelection = (editor: Editor): boolean => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return false

  const rect = selectedRect(editor.state)
  const isSingleRow =
    selection.isRowSelection() &&
    !selection.isColSelection() &&
    rect.bottom - rect.top === 1
  const isSingleCol =
    selection.isColSelection() &&
    !selection.isRowSelection() &&
    rect.right - rect.left === 1
  return isSingleRow || isSingleCol
}

const getSelectedDragHandleVirtualElement = (editor: Editor) => {
  if (!hasSingleHandleAnchorSelection(editor)) return null

  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return null

  const isRow = selection.isRowSelection() && !selection.isColSelection()
  const isCol = selection.isColSelection() && !selection.isRowSelection()
  if (!isRow && !isCol) return null

  const rect = selectedRect(editor.state)
  const tablePos = rect.tableStart - 1
  const axis = isRow ? "row" : "column"
  const index = isRow ? rect.top : rect.left
  const handle = getTableEditorOverlays(editor)?.querySelector(
    `[data-table-drag-handle="${axis}"][data-table-pos="${tablePos}"][data-index="${index}"][data-state="selected"]`,
  )
  if (!(handle instanceof HTMLElement)) return null

  const handleRect = handle.getBoundingClientRect()
  if (handleRect.width === 0 || handleRect.height === 0) return null

  return {
    getBoundingClientRect: () => handle.getBoundingClientRect(),
  }
}

export const createTableDragHandlesBubbleMenuAnchor = (
  editor: Editor,
): TableBubbleMenuAnchor => ({
  shouldWaitForReference: () =>
    hasSingleHandleAnchorSelection(editor) &&
    getSelectedDragHandleVirtualElement(editor) === null,
  getReferencedVirtualElement: () =>
    getSelectedDragHandleVirtualElement(editor),
})
