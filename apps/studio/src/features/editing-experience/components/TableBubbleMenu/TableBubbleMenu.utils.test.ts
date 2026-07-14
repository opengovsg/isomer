import { describe, expect, it } from "vitest"

import {
  getColumnMovePlan,
  getRowMovePlan,
  getTableSelectionKind,
} from "./TableBubbleMenu.utils"

describe("getTableSelectionKind", () => {
  const partialSelection = {
    spansEntireTableWidth: false,
    spansEntireTableHeight: false,
    allCellsAreHeaders: false,
    selectsSingleCellNode: false,
    selectedCellIsMerged: false,
  }

  it("classifies selections that span the entire table before either axis", () => {
    expect(
      getTableSelectionKind({
        ...partialSelection,
        spansEntireTableWidth: true,
        spansEntireTableHeight: true,
      }),
    ).toBe("table")
  })

  it.each([
    {
      facts: { spansEntireTableWidth: true },
      expected: "row",
    },
    {
      facts: {
        spansEntireTableWidth: true,
        allCellsAreHeaders: true,
      },
      expected: "header-row",
    },
    {
      facts: { spansEntireTableHeight: true },
      expected: "column",
    },
    {
      facts: {
        spansEntireTableHeight: true,
        allCellsAreHeaders: true,
      },
      expected: "header-column",
    },
  ])("classifies an axis selection as $expected", ({ facts, expected }) => {
    expect(getTableSelectionKind({ ...partialSelection, ...facts })).toBe(
      expected,
    )
  })

  it.each([
    {
      selectedCellIsMerged: false,
      expected: "single-cell",
    },
    {
      selectedCellIsMerged: true,
      expected: "merged-cell",
    },
  ])(
    "classifies a single selected node as $expected",
    ({ selectedCellIsMerged, expected }) => {
      expect(
        getTableSelectionKind({
          ...partialSelection,
          selectsSingleCellNode: true,
          selectedCellIsMerged,
        }),
      ).toBe(expected)
    },
  )

  it("classifies the remaining selection shape as multi-cell", () => {
    expect(getTableSelectionKind(partialSelection)).toBe("multi-cell")
  })
})

describe("getRowMovePlan", () => {
  it.each([
    {
      direction: "up" as const,
      expected: { from: 0, to: 2, newStart: 0, span: 2 },
    },
    {
      direction: "down" as const,
      expected: { from: 3, to: 1, newStart: 2, span: 2 },
    },
  ])(
    "moves the adjacent row $direction past the block",
    ({ direction, expected }) => {
      expect(
        getRowMovePlan({ top: 1, bottom: 3, tableHeight: 4 }, direction),
      ).toEqual(expected)
    },
  )

  it("does not move beyond the top or bottom table edge", () => {
    expect(
      getRowMovePlan({ top: 0, bottom: 2, tableHeight: 4 }, "up"),
    ).toBeNull()
    expect(
      getRowMovePlan({ top: 2, bottom: 4, tableHeight: 4 }, "down"),
    ).toBeNull()
  })
})

describe("getColumnMovePlan", () => {
  it.each([
    {
      direction: "left" as const,
      expected: { from: 0, to: 2, newStart: 0, span: 2 },
    },
    {
      direction: "right" as const,
      expected: { from: 3, to: 1, newStart: 2, span: 2 },
    },
  ])(
    "moves the adjacent column $direction past the block",
    ({ direction, expected }) => {
      expect(
        getColumnMovePlan({ left: 1, right: 3, tableWidth: 4 }, direction),
      ).toEqual(expected)
    },
  )

  it("does not move beyond the left or right table edge", () => {
    expect(
      getColumnMovePlan({ left: 0, right: 2, tableWidth: 4 }, "left"),
    ).toBeNull()
    expect(
      getColumnMovePlan({ left: 2, right: 4, tableWidth: 4 }, "right"),
    ).toBeNull()
  })
})
