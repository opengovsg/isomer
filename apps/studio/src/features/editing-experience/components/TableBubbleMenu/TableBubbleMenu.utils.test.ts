import type { Node } from "@tiptap/pm/model"
import { describe, expect, it } from "vitest"

import {
  getColumnMovePlan,
  getRowMovePlan,
  getTableSelectionKind,
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
  type TableHeaderOverlapRect,
} from "./TableBubbleMenu.utils"

// Builds a rect whose map offsets are 0..n-1 and whose table.nodeAt(i) returns
// the ith cell type — enough for the header-overlap helpers without a live editor.
const overlapRect = ({
  top,
  left,
  width,
  height,
  cellTypes,
}: {
  top: number
  left: number
  width: number
  height: number
  cellTypes: string[]
}): TableHeaderOverlapRect => {
  const map = cellTypes.map((_, index) => index)
  const table = {
    nodeAt: (pos: number) => {
      const typeName = cellTypes[pos]
      return typeName ? { type: { name: typeName } } : null
    },
  } as Node

  return {
    top,
    left,
    map: { width, height, map },
    table,
  }
}

describe("getTableSelectionKind", () => {
  const partialSelection = {
    spansEntireTableWidth: false,
    spansEntireTableHeight: false,
    allCellsAreHeaders: false,
    isTopRow: false,
    isLeftmostColumn: false,
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
        isTopRow: true,
      },
      expected: "header-row",
    },
    {
      // A full-width body row that happens to be all header cells is still a
      // normal row — TipTap's header-row toggle only targets the first row.
      facts: {
        spansEntireTableWidth: true,
        allCellsAreHeaders: true,
        isTopRow: false,
      },
      expected: "row",
    },
    {
      facts: { spansEntireTableHeight: true },
      expected: "column",
    },
    {
      facts: {
        spansEntireTableHeight: true,
        allCellsAreHeaders: true,
        isLeftmostColumn: true,
      },
      expected: "header-column",
    },
    {
      facts: {
        spansEntireTableHeight: true,
        allCellsAreHeaders: true,
        isLeftmostColumn: false,
      },
      expected: "column",
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

describe("selectionIncludesHeaderRow", () => {
  const headerThenBody = [
    "tableHeader",
    "tableHeader",
    "tableHeader",
    "tableCell",
    "tableCell",
    "tableCell",
  ]

  it("is true when the selection overlaps a header row at the top", () => {
    expect(
      selectionIncludesHeaderRow(
        overlapRect({
          top: 0,
          left: 0,
          width: 3,
          height: 2,
          cellTypes: headerThenBody,
        }),
      ),
    ).toBe(true)
  })

  it("is false when the selection starts below the header row", () => {
    expect(
      selectionIncludesHeaderRow(
        overlapRect({
          top: 1,
          left: 0,
          width: 3,
          height: 2,
          cellTypes: headerThenBody,
        }),
      ),
    ).toBe(false)
  })

  it("is false when the top row is ordinary body cells", () => {
    expect(
      selectionIncludesHeaderRow(
        overlapRect({
          top: 0,
          left: 0,
          width: 2,
          height: 1,
          cellTypes: ["tableCell", "tableCell"],
        }),
      ),
    ).toBe(false)
  })
})

describe("selectionIncludesHeaderColumn", () => {
  // Header row + header column (intersection and first body cell are headers).
  const headerRowAndColumn = [
    "tableHeader",
    "tableHeader",
    "tableHeader",
    "tableCell",
    "tableHeader",
    "tableCell",
  ]

  it("is true when the selection overlaps a header column at the left", () => {
    expect(
      selectionIncludesHeaderColumn(
        overlapRect({
          top: 0,
          left: 0,
          width: 2,
          height: 3,
          cellTypes: headerRowAndColumn,
        }),
      ),
    ).toBe(true)
  })

  it("is false when the selection starts to the right of the header column", () => {
    expect(
      selectionIncludesHeaderColumn(
        overlapRect({
          top: 0,
          left: 1,
          width: 2,
          height: 3,
          cellTypes: headerRowAndColumn,
        }),
      ),
    ).toBe(false)
  })

  it("is false when only the first row is headers (header row, not column)", () => {
    expect(
      selectionIncludesHeaderColumn(
        overlapRect({
          top: 0,
          left: 0,
          width: 2,
          height: 2,
          cellTypes: ["tableHeader", "tableHeader", "tableCell", "tableCell"],
        }),
      ),
    ).toBe(false)
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
