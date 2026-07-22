import { describe, expect, it } from "vitest"

import {
  getSelectedCellBorderClasses,
  SELECTED_CELL_BORDER_CLASSES,
} from "../getSelectedCellBorderClasses"

describe("getSelectedCellBorderClasses", () => {
  const selectionRect = { left: 1, top: 1, right: 3, bottom: 3 }

  it("returns all four sides for a single-cell selection", () => {
    // Arrange
    const singleCellSelection = { left: 0, top: 0, right: 1, bottom: 1 }
    const cellRect = { left: 0, top: 0, right: 1, bottom: 1 }

    // Act
    const classes = getSelectedCellBorderClasses(singleCellSelection, cellRect)

    // Assert
    expect(classes).toEqual([
      SELECTED_CELL_BORDER_CLASSES.top,
      SELECTED_CELL_BORDER_CLASSES.right,
      SELECTED_CELL_BORDER_CLASSES.bottom,
      SELECTED_CELL_BORDER_CLASSES.left,
    ])
  })

  it("returns only outer edges for a corner cell in a multi-cell selection", () => {
    // Arrange
    const topLeftCell = { left: 1, top: 1, right: 2, bottom: 2 }

    // Act
    const classes = getSelectedCellBorderClasses(selectionRect, topLeftCell)

    // Assert
    expect(classes).toEqual([
      SELECTED_CELL_BORDER_CLASSES.top,
      SELECTED_CELL_BORDER_CLASSES.left,
    ])
  })

  it("returns no edges for an interior cell", () => {
    // Arrange — 3x3 selection with an interior cell at (2,2)
    const largeSelection = { left: 0, top: 0, right: 3, bottom: 3 }
    const interiorCell = { left: 1, top: 1, right: 2, bottom: 2 }

    // Act
    const classes = getSelectedCellBorderClasses(largeSelection, interiorCell)

    // Assert
    expect(classes).toEqual([])
  })

  it("returns the full left edge for a leftmost cell spanning the selection height", () => {
    // Arrange — row-selection-like leftmost merged/tall cell
    const rowSelection = { left: 0, top: 1, right: 3, bottom: 2 }
    const leftmostCell = { left: 0, top: 1, right: 1, bottom: 2 }

    // Act
    const classes = getSelectedCellBorderClasses(rowSelection, leftmostCell)

    // Assert
    expect(classes).toEqual([
      SELECTED_CELL_BORDER_CLASSES.top,
      SELECTED_CELL_BORDER_CLASSES.bottom,
      SELECTED_CELL_BORDER_CLASSES.left,
    ])
  })

  it("returns top/bottom/right for the rightmost cell in a row selection", () => {
    // Arrange
    const rowSelection = { left: 0, top: 1, right: 3, bottom: 2 }
    const rightmostCell = { left: 2, top: 1, right: 3, bottom: 2 }

    // Act
    const classes = getSelectedCellBorderClasses(rowSelection, rightmostCell)

    // Assert
    expect(classes).toEqual([
      SELECTED_CELL_BORDER_CLASSES.top,
      SELECTED_CELL_BORDER_CLASSES.right,
      SELECTED_CELL_BORDER_CLASSES.bottom,
    ])
  })
})
