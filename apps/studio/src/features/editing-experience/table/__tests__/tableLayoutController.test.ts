import type { Editor } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import { buildColgroupSpec } from "../tableColumnWidths"
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

  it("should update existing col widths without rebuilding colgroup", () => {
    // Arrange
    const table = document.createElement("table")
    applyColumnWidths(table, [50, 50])
    const initialColgroup = table.querySelector("colgroup")

    // Act
    applyColumnWidths(table, [60, 40])

    // Assert
    expect(table.querySelector("colgroup")).toBe(initialColgroup)
    const cols = table.querySelectorAll("col")
    expect(cols).toHaveLength(2)
    expect(cols[0]?.style.width).toBe("60%")
    expect(cols[1]?.style.width).toBe("40%")
  })

  it("should use the shared colgroup spec for table layout", () => {
    // Arrange
    const table = document.createElement("table")
    const spec = buildColgroupSpec([25, 75])

    // Act
    applyColumnWidths(table, [25, 75])

    // Assert
    expect(table.style.tableLayout).toBe(spec.tableLayout)
    expect(table.querySelector("col")?.style.width).toBe(spec.columnWidths[0])
  })
})
