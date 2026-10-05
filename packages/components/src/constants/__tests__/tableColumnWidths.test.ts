import { describe, expect, it } from "vitest"

import {
  clampTableColumnWidth,
  TABLE_COLUMN_WIDTH_DEFAULT_PX,
  TABLE_COLUMN_WIDTH_MAX_PX,
  TABLE_COLUMN_WIDTH_MIN_PX,
  validateTableColumnWidths,
} from "../tableColumnWidths"

describe("validateTableColumnWidths", () => {
  it("returns clamped widths for a valid array", () => {
    expect(validateTableColumnWidths([100, 200, 300], 3)).toEqual([
      100, 200, 300,
    ])
  })

  it("returns null when length does not match column count", () => {
    expect(validateTableColumnWidths([100, 200], 3)).toBeNull()
  })

  it("returns null for non-array input", () => {
    expect(validateTableColumnWidths(null, 2)).toBeNull()
    expect(validateTableColumnWidths(undefined, 2)).toBeNull()
    expect(validateTableColumnWidths("160", 1)).toBeNull()
  })

  it("returns null when any entry is not a finite number", () => {
    expect(validateTableColumnWidths([100, NaN], 2)).toBeNull()
    expect(validateTableColumnWidths([100, -1], 2)).toEqual([100, 80])
    expect(validateTableColumnWidths([100, "200"], 2)).toBeNull()
  })

  it("clamps and rounds each width", () => {
    expect(validateTableColumnWidths([10, 999.6, 160.4], 3)).toEqual([
      TABLE_COLUMN_WIDTH_MIN_PX,
      TABLE_COLUMN_WIDTH_MAX_PX,
      160,
    ])
  })

  it("returns null for zero column count", () => {
    expect(validateTableColumnWidths([160], 0)).toBeNull()
  })
})

describe("clampTableColumnWidth", () => {
  it("clamps to min and max", () => {
    expect(clampTableColumnWidth(10)).toBe(TABLE_COLUMN_WIDTH_MIN_PX)
    expect(clampTableColumnWidth(900)).toBe(TABLE_COLUMN_WIDTH_MAX_PX)
    expect(clampTableColumnWidth(TABLE_COLUMN_WIDTH_DEFAULT_PX)).toBe(
      TABLE_COLUMN_WIDTH_DEFAULT_PX,
    )
  })
})
