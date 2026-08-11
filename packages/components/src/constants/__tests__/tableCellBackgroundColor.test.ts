import { describe, expect, it } from "vitest"

import {
  getTableCellBackgroundColorCss,
  getTableCellBackgroundColorCssForKind,
  isTableCellBackgroundColorToken,
  TABLE_CELL_BACKGROUND_COLORS,
  TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN,
} from "../tableCellBackgroundColor"

describe("isTableCellBackgroundColorToken", () => {
  it("accepts a known token", () => {
    expect(isTableCellBackgroundColorToken("blue")).toBe(true)
  })

  it("rejects inherited object property names", () => {
    expect(isTableCellBackgroundColorToken("toString")).toBe(false)
  })
})

describe("getTableCellBackgroundColorCss", () => {
  it("returns undefined for inherited object property names", () => {
    expect(getTableCellBackgroundColorCss("toString")).toBeUndefined()
  })
})

describe("getTableCellBackgroundColorCssForKind", () => {
  it("resolves Brand on header cells", () => {
    expect(
      getTableCellBackgroundColorCssForKind(
        TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN,
        { isHeader: true },
      ),
    ).toBe(
      TABLE_CELL_BACKGROUND_COLORS[TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN],
    )
  })

  it("ignores Brand on body cells", () => {
    expect(
      getTableCellBackgroundColorCssForKind(
        TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN,
        { isHeader: false },
      ),
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
