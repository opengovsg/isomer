import { describe, expect, it } from "vitest"

import {
  getTableCellBackgroundColorCss,
  isTableCellBackgroundColorToken,
  TABLE_CELL_BACKGROUND_COLORS,
} from "../tableCellBackgroundColor"

describe("isTableCellBackgroundColorToken", () => {
  it("accepts a known token", () => {
    expect(isTableCellBackgroundColorToken("blue")).toBe(true)
  })

  it("rejects inherited object property names", () => {
    expect(isTableCellBackgroundColorToken("toString")).toBe(false)
  })

  it("rejects unknown tokens", () => {
    expect(isTableCellBackgroundColorToken("brand.canvas.inverse")).toBe(false)
  })
})

describe("getTableCellBackgroundColorCss", () => {
  it("resolves palette tokens", () => {
    expect(getTableCellBackgroundColorCss("blue")).toBe(
      TABLE_CELL_BACKGROUND_COLORS.blue,
    )
  })

  it("returns undefined for inherited object property names", () => {
    expect(getTableCellBackgroundColorCss("toString")).toBeUndefined()
  })

  it("returns undefined for unknown values", () => {
    expect(getTableCellBackgroundColorCss("red")).toBeUndefined()
  })
})
