import { describe, expect, it } from "vitest"

import {
  getSelectedCellBorderClasses,
  SELECTED_CELL_BORDER_CLASSES,
} from "../getSelectedCellBorderClasses"

describe("getSelectedCellBorderClasses", () => {
  const selectionRect = { bottom: 3, left: 1, right: 3, top: 1 }

  it("returns all four sides for a single-cell selection", () => {
    // Arrange
    const singleCellSelection = { bottom: 1, left: 0, right: 1, top: 0 }
    const cellRect = { bottom: 1, left: 0, right: 1, top: 0 }

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
    const topLeftCell = { bottom: 2, left: 1, right: 2, top: 1 }

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
    const largeSelection = { bottom: 3, left: 0, right: 3, top: 0 }
    const interiorCell = { bottom: 2, left: 1, right: 2, top: 1 }

    // Act
    const classes = getSelectedCellBorderClasses(largeSelection, interiorCell)

    // Assert
    expect(classes).toEqual([])
  })

  it("returns the full left edge for a leftmost cell spanning the selection height", () => {
    // Arrange — row-selection-like leftmost merged/tall cell
    const rowSelection = { bottom: 2, left: 0, right: 3, top: 1 }
    const leftmostCell = { bottom: 2, left: 0, right: 1, top: 1 }

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
    const rowSelection = { bottom: 2, left: 0, right: 3, top: 1 }
    const rightmostCell = { bottom: 2, left: 2, right: 3, top: 1 }

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
