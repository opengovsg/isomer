import type { Node } from "@tiptap/pm/model"
import type { TableMap } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"
import {
  selectionOverlapsLockedAxis,
  type TableHeaderOverlapRect,
} from "~/features/editing-experience/table-editing/axis"

import {
  getMovedBlockCellCorners,
  getSlotMovePlan,
  getTableSelectionKind,
} from "../TableBubbleMenu.utils"

// Builds a minimal rect for header-overlap helpers (no live editor).
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
      // All-header row below row 0 is still a normal row selection.
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

describe("selectionOverlapsLockedAxis", () => {
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
      selectionOverlapsLockedAxis(
        overlapRect({
          top: 0,
          left: 0,
          width: 3,
          height: 2,
          cellTypes: headerThenBody,
        }),
        "row",
      ),
    ).toBe(true)
  })

  it("is false when the selection starts below the header row", () => {
    expect(
      selectionOverlapsLockedAxis(
        overlapRect({
          top: 1,
          left: 0,
          width: 3,
          height: 2,
          cellTypes: headerThenBody,
        }),
        "row",
      ),
    ).toBe(false)
  })

  it("is false when the top row is ordinary body cells", () => {
    expect(
      selectionOverlapsLockedAxis(
        overlapRect({
          top: 0,
          left: 0,
          width: 2,
          height: 1,
          cellTypes: ["tableCell", "tableCell"],
        }),
        "row",
      ),
    ).toBe(false)
  })
})

describe("selectionOverlapsLockedAxis column", () => {
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
      selectionOverlapsLockedAxis(
        overlapRect({
          top: 0,
          left: 0,
          width: 2,
          height: 3,
          cellTypes: headerRowAndColumn,
        }),
        "column",
      ),
    ).toBe(true)
  })

  it("is false when the selection starts to the right of the header column", () => {
    expect(
      selectionOverlapsLockedAxis(
        overlapRect({
          top: 0,
          left: 1,
          width: 2,
          height: 3,
          cellTypes: headerRowAndColumn,
        }),
        "column",
      ),
    ).toBe(false)
  })

  it("is false when only the first row is headers (header row, not column)", () => {
    expect(
      selectionOverlapsLockedAxis(
        overlapRect({
          top: 0,
          left: 0,
          width: 2,
          height: 2,
          cellTypes: ["tableHeader", "tableHeader", "tableCell", "tableCell"],
        }),
        "column",
      ),
    ).toBe(false)
  })
})

describe("getSlotMovePlan", () => {
  const rowRect = (top: number, bottom: number, tableHeight: number) => ({
    top,
    bottom,
    left: 0,
    right: 1,
    map: { width: 1, height: tableHeight },
  })

  const columnRect = (left: number, right: number, tableWidth: number) => ({
    top: 0,
    bottom: 1,
    left,
    right,
    map: { width: tableWidth, height: 1 },
  })

  it.each([
    {
      direction: "backward" as const,
      expected: { from: 0, to: 2, newStart: 0, span: 2 },
    },
    {
      direction: "forward" as const,
      expected: { from: 3, to: 1, newStart: 2, span: 2 },
    },
  ])(
    "moves the adjacent row $direction past the block",
    ({ direction, expected }) => {
      // Arrange / Act / Assert
      expect(getSlotMovePlan("row", rowRect(1, 3, 4), direction)).toEqual(
        expected,
      )
    },
  )

  it.each([
    {
      direction: "backward" as const,
      rect: rowRect(0, 2, 4),
      edge: "top",
    },
    {
      direction: "forward" as const,
      rect: rowRect(2, 4, 4),
      edge: "bottom",
    },
  ])(
    "does not move a row beyond the $edge table edge",
    ({ direction, rect }) => {
      // Arrange / Act / Assert
      expect(getSlotMovePlan("row", rect, direction)).toBeNull()
    },
  )

  it.each([
    {
      direction: "backward" as const,
      expected: { from: 0, to: 2, newStart: 0, span: 2 },
    },
    {
      direction: "forward" as const,
      expected: { from: 3, to: 1, newStart: 2, span: 2 },
    },
  ])(
    "moves the adjacent column $direction past the block",
    ({ direction, expected }) => {
      // Arrange / Act / Assert
      expect(getSlotMovePlan("column", columnRect(1, 3, 4), direction)).toEqual(
        expected,
      )
    },
  )

  it.each([
    {
      direction: "backward" as const,
      rect: columnRect(0, 2, 4),
      edge: "left",
    },
    {
      direction: "forward" as const,
      rect: columnRect(2, 4, 4),
      edge: "right",
    },
  ])(
    "does not move a column beyond the $edge table edge",
    ({ direction, rect }) => {
      // Arrange / Act / Assert
      expect(getSlotMovePlan("column", rect, direction)).toBeNull()
    },
  )
})

const tableMap = ({
  width,
  height,
}: {
  width: number
  height: number
}): Pick<TableMap, "width" | "height" | "positionAt"> => ({
  width,
  height,
  positionAt: (row, col) => row * width + col,
})

const emptyTable = {} as Node

describe("getMovedBlockCellCorners", () => {
  const plan = { from: 0, to: 1, newStart: 1, span: 2 }

  it("selects top-left to bottom-right for a moved row block", () => {
    const map = tableMap({ width: 4, height: 3 })
    expect(getMovedBlockCellCorners(map, emptyTable, plan, "row")).toEqual({
      anchor: 4,
      head: 11,
    })
  })

  it("selects bottom-left to top-right for a moved column block", () => {
    const map = tableMap({ width: 4, height: 3 })
    expect(getMovedBlockCellCorners(map, emptyTable, plan, "column")).toEqual({
      anchor: 9,
      head: 2,
    })
  })
})
