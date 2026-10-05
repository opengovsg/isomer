import { describe, expect, it } from "vitest"

import {
  duplicateTableColumnWidth,
  insertTableColumnWidth,
  moveTableColumnWidth,
  removeTableColumnWidth,
} from "../tableColumnWidthSync"

describe("tableColumnWidthSync helpers", () => {
  const widths = [100, 160, 200]

  it("inserts default width at index", () => {
    expect(insertTableColumnWidth(widths, 1)).toEqual([100, 160, 160, 200])
    expect(insertTableColumnWidth(widths, 1, 120)).toEqual([100, 120, 160, 200])
  })

  it("removes width at index", () => {
    expect(removeTableColumnWidth(widths, 1)).toEqual([100, 200])
  })

  it("moves width with the column", () => {
    expect(moveTableColumnWidth(widths, 0, 2)).toEqual([160, 200, 100])
    expect(moveTableColumnWidth(widths, 2, 0)).toEqual([200, 100, 160])
  })

  it("copies source width when duplicating", () => {
    expect(duplicateTableColumnWidth(widths, 1, 2)).toEqual([
      100, 160, 160, 200,
    ])
    expect(duplicateTableColumnWidth(widths, 0, 3)).toEqual([
      100, 160, 200, 100,
    ])
  })
})
