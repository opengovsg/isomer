import { describe, expect, it } from "vitest"

import { shouldDimUnselectedTableCells } from "../shouldDimUnselectedTableCells"

const tableMap = {
  width: 4,
  height: 3,
  map: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

describe("shouldDimUnselectedTableCells", () => {
  it("is false for a single merged-cell selection", () => {
    expect(
      shouldDimUnselectedTableCells({
        left: 1,
        top: 1,
        right: 3,
        bottom: 3,
        map: {
          width: 4,
          height: 3,
          // One cell node spans this 2×2 block (offsets repeat in TableMap).
          map: [0, 1, 2, 3, 4, 5, 5, 6, 8, 5, 5, 11],
        },
      }),
    ).toBe(false)
  })

  it("is false for a single-cell selection", () => {
    expect(
      shouldDimUnselectedTableCells({
        left: 1,
        top: 1,
        right: 2,
        bottom: 2,
        map: tableMap,
      }),
    ).toBe(false)
  })

  it("is false for a full-table selection", () => {
    expect(
      shouldDimUnselectedTableCells({
        left: 0,
        top: 0,
        right: 4,
        bottom: 3,
        map: tableMap,
      }),
    ).toBe(false)
  })

  it("is true for a single-row selection", () => {
    expect(
      shouldDimUnselectedTableCells({
        left: 0,
        top: 1,
        right: 4,
        bottom: 2,
        map: tableMap,
      }),
    ).toBe(true)
  })

  it("is true for a single-column selection", () => {
    expect(
      shouldDimUnselectedTableCells({
        left: 2,
        top: 0,
        right: 3,
        bottom: 3,
        map: tableMap,
      }),
    ).toBe(true)
  })

  it("is true for a multi-row, multi-column block", () => {
    expect(
      shouldDimUnselectedTableCells({
        left: 1,
        top: 0,
        right: 3,
        bottom: 2,
        map: tableMap,
      }),
    ).toBe(true)
  })
})
