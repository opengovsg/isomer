import { describe, expect, it } from "vitest"

import { redistributeOnResize } from "../redistributeOnResize"

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
    expect(result[2]).toBe(20)
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 6)
  })

  it("should affect the neighbour to the right of the dragged handle, not column 0", () => {
    // Arrange
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

  it("should keep both pair widths non-negative when combined width is below 2 * minPercent", () => {
    // Arrange: 52 equal columns on a ~500px table (minPercent = 5, pair = 200/52 %).
    const columnCount = 52
    const widths = Array.from({ length: columnCount }, () => 100 / columnCount)
    const minPercent = 5

    // Act
    const result = redistributeOnResize({
      widths,
      columnIndex: 0,
      deltaPercent: 10,
      minPercent,
    })

    // Assert
    expect(result[0]).toBeGreaterThanOrEqual(0)
    expect(result[1]).toBeGreaterThanOrEqual(0)
    expect((result[0] ?? 0) + (result[1] ?? 0)).toBeCloseTo(
      200 / columnCount,
      5,
    )
    expect(result.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 5)
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

    // Assert
    expect(result[0]).toBeCloseTo(40, 5)
    expect(result[1]).toBeCloseTo(10, 5)
    expect(result[2]).toBe(25)
    expect(result[3]).toBe(25)
  })
})
