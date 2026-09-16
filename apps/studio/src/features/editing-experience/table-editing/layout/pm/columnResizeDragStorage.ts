import type { Editor } from "@tiptap/react"

interface IsomerTableEditorStorage {
  columnResizeDragCount?: number
}

const getIsomerTableStorage = (editor: Editor): IsomerTableEditorStorage => {
  const root = editor.storage as { table?: IsomerTableEditorStorage }
  root.table ??= createInitialTableColumnResizeStorage()
  return root.table
}

export const isTableColumnResizeDragging = (editor: Editor): boolean =>
  (getIsomerTableStorage(editor).columnResizeDragCount ?? 0) > 0

export const beginTableColumnResizeDrag = (editor: Editor): void => {
  const storage = getIsomerTableStorage(editor)
  storage.columnResizeDragCount = (storage.columnResizeDragCount ?? 0) + 1
}

export const endTableColumnResizeDrag = (editor: Editor): void => {
  const storage = getIsomerTableStorage(editor)
  storage.columnResizeDragCount = Math.max(
    0,
    (storage.columnResizeDragCount ?? 0) - 1,
  )
}

export const createInitialTableColumnResizeStorage = () => ({
  columnResizeDragCount: 0,
})
