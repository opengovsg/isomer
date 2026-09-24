import type { Node } from "@tiptap/pm/model"
import type { TableMap } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"

import {
  getColumnMovePlan,
  getMovedBlockCellCorners,
  getRowMovePlan,
  getTableSelectionKind,
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
  selectionIsFullyMergedColumn,
  selectionIsFullyMergedRow,
  type TableHeaderOverlapRect,
  type TableSelectionRect,
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

const cellNode = (attrs: { colspan?: number; rowspan?: number }) =>
  ({ attrs: { colspan: 1, rowspan: 1, ...attrs } }) as unknown as Node

const selectionRect = ({
  width,
  height,
  top = 0,
  bottom,
  left = 0,
  right,
  cell,
}: {
  width: number
  height: number
  top?: number
  bottom?: number
  left?: number
  right?: number
  cell: Node
}): TableSelectionRect => ({
  tableStart: 1,
  top,
  bottom: bottom ?? height,
  left,
  right: right ?? width,
  map: {
    width,
    height,
    map: [0],
  } as TableMap,
  table: {
    nodeAt: () => cell,
  } as unknown as Node,
})

describe("selectionIsFullyMergedRow", () => {
  it("is true for a full-width row that is one merged cell", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      cell: cellNode({ colspan: 3 }),
    })

    expect(selectionIsFullyMergedRow(rect)).toBe(true)
  })

  it("is false when the row still has multiple cells", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      cell: cellNode({ colspan: 2 }),
    })

    expect(selectionIsFullyMergedRow(rect)).toBe(false)
  })

  it("is false when the selection does not span the full table width", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      left: 0,
      right: 2,
      cell: cellNode({ colspan: 2 }),
    })

    expect(selectionIsFullyMergedRow(rect)).toBe(false)
  })

  it("is false when the selection spans multiple rows", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      bottom: 2,
      cell: cellNode({ colspan: 3 }),
    })

    expect(selectionIsFullyMergedRow(rect)).toBe(false)
  })
})

describe("selectionIsFullyMergedColumn", () => {
  it("is true for a full-height column that is one merged cell", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      left: 1,
      right: 2,
      cell: cellNode({ rowspan: 3 }),
    })

    expect(selectionIsFullyMergedColumn(rect)).toBe(true)
  })

  it("is false when the column still has multiple cells", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      left: 1,
      right: 2,
      cell: cellNode({ rowspan: 2 }),
    })

    expect(selectionIsFullyMergedColumn(rect)).toBe(false)
  })

  it("is false when the selection does not span the full table height", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      top: 1,
      bottom: 3,
      left: 1,
      right: 2,
      cell: cellNode({ rowspan: 2 }),
    })

    expect(selectionIsFullyMergedColumn(rect)).toBe(false)
  })

  it("is false when the selection spans multiple columns", () => {
    const rect = selectionRect({
      width: 3,
      height: 3,
      right: 2,
      cell: cellNode({ rowspan: 3 }),
    })

    expect(selectionIsFullyMergedColumn(rect)).toBe(false)
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
