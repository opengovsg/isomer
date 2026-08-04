import { describe, expect, it } from "vitest"

import {
  getTableCellBackgroundColorHex,
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

describe("getTableCellBackgroundColorHex", () => {
  it("returns undefined for inherited object property names", () => {
    expect(getTableCellBackgroundColorHex("toString")).toBeUndefined()
  })
})
