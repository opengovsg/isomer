import type { Editor } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import {
  applyColumnWidths,
  beginTableColumnResizeDrag,
  createInitialTableColumnResizeStorage,
  endTableColumnResizeDrag,
  isTableColumnResizeDragging,
} from "../tableLayoutController"

const createEditorWithTableStorage = (
  storage: ReturnType<typeof createInitialTableColumnResizeStorage>,
): Editor =>
  ({
    storage: {
      table: storage,
    },
  }) as Editor

describe("tableLayoutController drag storage", () => {
  it("should track drag state on editor storage", () => {
    // Arrange
    const storage = createInitialTableColumnResizeStorage()
    const editor = createEditorWithTableStorage(storage)

    // Act
    beginTableColumnResizeDrag(editor)

    // Assert
    expect(isTableColumnResizeDragging(editor)).toBe(true)
    expect(storage.columnResizeDragCount).toBe(1)

    // Act
    endTableColumnResizeDrag(editor)

    // Assert
    expect(isTableColumnResizeDragging(editor)).toBe(false)
    expect(storage.columnResizeDragCount).toBe(0)
  })
})

describe("applyColumnWidths", () => {
  it("should create a colgroup with percentage widths", () => {
    // Arrange
    const table = document.createElement("table")

    // Act
    applyColumnWidths(table, [50, 30, 20])

    // Assert
    expect(table.style.tableLayout).toBe("fixed")
    const cols = table.querySelectorAll("col")
    expect(cols).toHaveLength(3)
    expect(cols[0]?.style.width).toBe("50%")
    expect(cols[2]?.style.width).toBe("20%")
  })

  it("should rebuild colgroup when column count changes", () => {
    // Arrange
    const table = document.createElement("table")
    applyColumnWidths(table, [50, 50])

    // Act
    applyColumnWidths(table, [34, 33, 33])

    // Assert
    const cols = table.querySelectorAll("col")
    expect(cols).toHaveLength(3)
    expect(cols[0]?.style.width).toBe("34%")
  })
})
