import { describe, expect, it } from "vitest"

import { MAX_TABLE_COLUMNS, normalizeSpan } from "./tableLayoutLimits"

describe("normalizeSpan", () => {
  it.each([
    [undefined, 1],
    [null, 1],
    ["1e9", 1],
    [-5, 1],
    [0, 1],
    [1.5, 1],
    [1, 1],
    [64, 64],
    [99999999, MAX_TABLE_COLUMNS],
    [4294967296, MAX_TABLE_COLUMNS],
  ] as const)("normalizes %j to %i", (value, expected) => {
    expect(normalizeSpan(value)).toBe(expected)
  })
})
