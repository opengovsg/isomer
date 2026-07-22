import { describe, expect, it } from "vitest"

import {
  getEqualColumnWidths,
  redistributeOnResize,
  resolveColumnWidths,
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

  it("should return an empty array without throwing when columnCount is 0", () => {
    // Arrange: the table's last column was just deleted, leaving no columns.
    const columnCount = 0

    // Act
    const widths = getEqualColumnWidths(columnCount)

    // Assert
    expect(widths).toEqual([])
  })
})

describe("resolveColumnWidths", () => {
  it("should fall back to an equal split when colwidths is null", () => {
    // Act
    const result = resolveColumnWidths(null, 3)

    // Assert
    expect(result).toEqual(getEqualColumnWidths(3))
  })

  it("should fall back to an equal split when colwidths is not an array", () => {
    // Act
    const result = resolveColumnWidths("not-an-array", 3)

    // Assert
    expect(result).toEqual(getEqualColumnWidths(3))
  })

  it("should fall back to an equal split when the length doesn't match the column count", () => {
    // Arrange: stale from before a column was added, not yet normalized.
    const colwidths = [50, 30, 20]

    // Act
    const result = resolveColumnWidths(colwidths, 4)

    // Assert
    expect(result).toEqual(getEqualColumnWidths(4))
  })

  it("should fall back to an equal split when any entry is null", () => {
    // Arrange
    const colwidths = [50, null, 20]

    // Act
    const result = resolveColumnWidths(colwidths, 3)

    // Assert
    expect(result).toEqual(getEqualColumnWidths(3))
  })

  it("should return the explicit widths when the array is complete and the right length", () => {
    // Arrange
    const colwidths = [50, 30, 20]

    // Act
    const result = resolveColumnWidths(colwidths, 3)

    // Assert
    expect(result).toEqual([50, 30, 20])
  })
})

describe("redistributeOnResize", () => {
  it("should grow the dragged column and shrink its direct neighbour by the same amount", () => {
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
    expect(result[1]).toBeCloseTo(13, 5)
    // Columns 2 and 3 are untouched -- only the dragged column and its
    // direct neighbour ever change.
    expect(result[2]).toBe(25)
    expect(result[3]).toBe(25)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should shrink the dragged column and grow its direct neighbour by the same amount", () => {
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
    expect(result[1]).toBeCloseTo(40, 5)
    // Column 2 is not the dragged column's neighbour, so it's untouched.
    expect(result[2]).toBe(20)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should affect the neighbour to the right of the dragged handle, not column 0", () => {
    // Arrange: dragging the boundary between columns 1 and 2.
    const widths = [50, 30, 20]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 1,
      deltaPercent: 10,
      minPercent: 5,
    })

    // Assert
    expect(result[0]).toBe(50)
    expect(result[1]).toBeCloseTo(40, 5)
    expect(result[2]).toBeCloseTo(10, 5)
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
    expect(result[1]).toBeCloseTo(40, 5)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should clamp the neighbour at the minimum width when growing the dragged column", () => {
    // Arrange
    const widths = [25, 25, 25, 25]

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: 1000,
      minPercent: 10,
    })

    // Assert: the pair combines for 50, so column 0 can grow to at most 40
    // before column 1 hits the 10% floor. Columns 2 and 3 are untouched.
    expect(result[0]).toBeCloseTo(40, 5)
    expect(result[1]).toBeCloseTo(10, 5)
    expect(result[2]).toBe(25)
    expect(result[3]).toBe(25)
  })
})
