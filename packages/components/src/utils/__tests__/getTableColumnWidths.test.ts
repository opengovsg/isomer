import { describe, expect, it } from "vitest"
import {
  getEqualColumnWidths,
  resolveColumnWidths,
} from "~/utils/getTableColumnWidths"

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

  it("should fall back to an equal split when any entry is not a number", () => {
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
