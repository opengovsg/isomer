import { describe, expect, it } from "vitest"

import {
  columnWidthsToPxStrings,
  parseTableColumnWidths,
  tableWidthPxFromColumnWidths,
} from "./tableColumnWidth"

describe("parseTableColumnWidths", () => {
  it("returns null when the list length does not match the column count", () => {
    // Arrange / Act / Assert
    expect(parseTableColumnWidths([160], 2)).toBeNull()
  })

  it("returns null when an entry is not a finite number", () => {
    // Arrange / Act / Assert
    expect(parseTableColumnWidths([160, Number.NaN], 2)).toBeNull()
  })

  it("clamps each width to the author range", () => {
    // Arrange / Act
    const widths = parseTableColumnWidths([10, 900], 2)

    // Assert
    expect(widths).toEqual([60, 400])
  })
})

describe("author table width helpers", () => {
  it("builds px col widths and total table width", () => {
    // Arrange / Act / Assert
    expect(columnWidthsToPxStrings([60, 400])).toEqual(["60px", "400px"])
    expect(tableWidthPxFromColumnWidths([60, 400])).toBe("460px")
  })
})
