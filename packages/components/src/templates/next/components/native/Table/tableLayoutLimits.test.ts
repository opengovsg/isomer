import { describe, expect, it } from "vitest"

import {
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  normalizeColspan,
  normalizeRowspan,
} from "./tableLayoutLimits"

describe("normalizeColspan", () => {
  it.each([
    [undefined, 1],
    [null, 1],
    ["1e9", 1],
    [-5, 1],
    [0, 1],
    [1.5, 1],
    [1, 1],
    [64, 64],
    [65, 64],
    [99999999, MAX_TABLE_COLUMNS],
    [4294967296, MAX_TABLE_COLUMNS],
  ] as const)("normalizes %j to %i", (value, expected) => {
    expect(normalizeColspan(value)).toBe(expected)
  })
})

describe("normalizeRowspan", () => {
  it.each([
    [undefined, 1],
    [null, 1],
    ["1e9", 1],
    [-5, 1],
    [0, 1],
    [1.5, 1],
    [1, 1],
    [65, 65],
    [64, 64],
    [1000, MAX_TABLE_ROWS],
    [99999999, MAX_TABLE_ROWS],
  ] as const)("normalizes %j to %i", (value, expected) => {
    expect(normalizeRowspan(value)).toBe(expected)
  })
})
