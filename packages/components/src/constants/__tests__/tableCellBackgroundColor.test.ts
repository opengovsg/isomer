import { describe, expect, it } from "vitest"

import {
  getTableCellBackgroundColorCss,
  getTableCellBackgroundColorCssForKind,
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

  it("rejects the deprecated brand token", () => {
    expect(isTableCellBackgroundColorToken("brand.canvas.inverse")).toBe(false)
  })
})

describe("getTableCellBackgroundColorCss", () => {
  it("returns undefined for inherited object property names", () => {
    expect(getTableCellBackgroundColorCss("toString")).toBeUndefined()
  })
})

describe("getTableCellBackgroundColorCssForKind", () => {
  it("ignores deprecated brand tokens on header cells", () => {
    expect(
      getTableCellBackgroundColorCssForKind("brand.canvas.inverse", {
        isHeader: true,
      }),
    ).toBeUndefined()
  })

  it("ignores deprecated brand tokens on body cells", () => {
    expect(
      getTableCellBackgroundColorCssForKind("brand.canvas.inverse", {
        isHeader: false,
      }),
    ).toBeUndefined()
  })

  it("resolves palette tokens on body cells", () => {
    expect(
      getTableCellBackgroundColorCssForKind("blue", { isHeader: false }),
    ).toBe(TABLE_CELL_BACKGROUND_COLORS.blue)
  })

  it("ignores palette tokens on header cells", () => {
    expect(
      getTableCellBackgroundColorCssForKind("blue", { isHeader: true }),
    ).toBeUndefined()
  })

  it("returns undefined for unknown values", () => {
    expect(
      getTableCellBackgroundColorCssForKind("toString", { isHeader: false }),
    ).toBeUndefined()
  })
})
