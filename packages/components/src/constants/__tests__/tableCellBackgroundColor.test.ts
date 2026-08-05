import { describe, expect, it } from "vitest"

import {
  getTableCellBackgroundColorCss,
  isTableCellBackgroundColorToken,
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
