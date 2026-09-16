import type { Editor } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import {
  beginTableColumnResizeDrag,
  createInitialTableColumnResizeStorage,
  endTableColumnResizeDrag,
  isTableColumnResizeDragging,
} from "../columnResizeDragStorage"

const createEditorWithTableStorage = (
  storage: ReturnType<typeof createInitialTableColumnResizeStorage>,
): Editor =>
  ({
    storage: {
      table: storage,
    },
  }) as unknown as Editor

describe("columnResizeDragStorage", () => {
  it("should mark editor storage as dragging when a resize drag begins", () => {
    // Arrange
    const storage = createInitialTableColumnResizeStorage()
    const editor = createEditorWithTableStorage(storage)

    // Act
    beginTableColumnResizeDrag(editor)

    // Assert
    expect(isTableColumnResizeDragging(editor)).toBe(true)
    expect(storage.columnResizeDragCount).toBe(1)
  })

  it("should clear drag state from editor storage when a resize drag ends", () => {
    // Arrange
    const storage = createInitialTableColumnResizeStorage()
    const editor = createEditorWithTableStorage(storage)
    beginTableColumnResizeDrag(editor)

    // Act
    endTableColumnResizeDrag(editor)

    // Assert
    expect(isTableColumnResizeDragging(editor)).toBe(false)
    expect(storage.columnResizeDragCount).toBe(0)
  })
})
