import { describe, expect, it } from "vitest"

import {
  getColumnWidthsFromRow,
  getEqualColumnWidths,
  redistributeOnResize,
} from "../tableColumnWidths"

describe("getEqualColumnWidths", () => {
  it("should split evenly and sum to 100", () => {
    // Arrange
    const columnCount = 4

    // Act
    const widths = getEqualColumnWidths(columnCount)

    // Assert
    expect(widths).toEqual([25, 25, 25, 25])
    expect(widths.reduce((sum, width) => sum + width, 0)).toBe(100)
  })
})

describe("getColumnWidthsFromRow", () => {
  it("should return null when any cell has a colspan other than 1", () => {
    // Arrange
    const cells = [
      { colspan: 2, colwidth: null },
      { colspan: 1, colwidth: null },
    ]

    // Act
    const result = getColumnWidthsFromRow(cells)

    // Assert
    expect(result).toBeNull()
  })

  it("should fall back to an equal split when some cells are missing a colwidth", () => {
    // Arrange
    const cells = [
      { colspan: 1, colwidth: 60 },
      { colspan: 1, colwidth: null },
      { colspan: 1, colwidth: 20 },
    ]

    // Act
    const result = getColumnWidthsFromRow(cells)

    // Assert
    expect(result).toEqual(getEqualColumnWidths(3))
  })

  it("should return the explicit widths when every cell has one", () => {
    // Arrange
    const cells = [
      { colspan: 1, colwidth: 50 },
      { colspan: 1, colwidth: 30 },
      { colspan: 1, colwidth: 20 },
    ]

    // Act
    const result = getColumnWidthsFromRow(cells)

    // Assert
    expect(result).toEqual([50, 30, 20])
  })

  it("should return null for an empty row", () => {
    // Act
    const result = getColumnWidthsFromRow([])

    // Assert
    expect(result).toBeNull()
  })
})

describe("redistributeOnResize", () => {
  it("should redistribute a grow proportionally among the other columns", () => {
    // Arrange
    const widths = [25, 25, 25, 25]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: 12,
      minPercent: 5,
    })

    // Assert
    expect(result[0]).toBeCloseTo(37, 5)
    // The other three columns each lose an equal share of the 12-point delta,
    // since they started with equal widths.
    expect(result[1]).toBeCloseTo(21, 5)
    expect(result[2]).toBeCloseTo(21, 5)
    expect(result[3]).toBeCloseTo(21, 5)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should redistribute a shrink proportionally among the other columns", () => {
    // Arrange
    const widths = [50, 30, 20]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: -10,
      minPercent: 5,
    })

    // Assert
    expect(result[0]).toBeCloseTo(40, 5)
    // Columns 1 and 2 split the freed-up 10 points proportional to their
    // 30:20 (i.e. 3:2) share of the combined "other columns" width.
    expect(result[1]).toBeCloseTo(36, 5)
    expect(result[2]).toBeCloseTo(24, 5)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should clamp the dragged column at the minimum width", () => {
    // Arrange
    const widths = [25, 25, 25, 25]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: -100,
      minPercent: 10,
    })

    // Assert
    expect(result[0]).toBeCloseTo(10, 5)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should clamp a neighbour at the floor and redistribute its shortfall to the rest", () => {
    // Arrange: column 1 starts right at the floor already, so any shrink on
    // it must be absorbed by column 2 instead.
    const widths = [40, 10, 50]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: 20,
      minPercent: 10,
    })

    // Assert
    expect(result[0]).toBeCloseTo(60, 5)
    expect(result[1]).toBeCloseTo(10, 5)
    expect(result[2]).toBeCloseTo(30, 5)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should never let the dragged column exceed the space left after everyone else is at the floor", () => {
    // Arrange
    const widths = [25, 25, 25, 25]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: 1000,
      minPercent: 10,
    })

    // Assert: 3 other columns at the 10% floor leaves at most 70% for column 0.
    expect(result[0]).toBeCloseTo(70, 5)
    expect(result[1]).toBeCloseTo(10, 5)
    expect(result[2]).toBeCloseTo(10, 5)
    expect(result[3]).toBeCloseTo(10, 5)
  })
})
