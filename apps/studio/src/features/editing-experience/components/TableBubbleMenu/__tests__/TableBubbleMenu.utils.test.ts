import type { Node, NodeSpec } from "@tiptap/pm/model"
import { Schema } from "@tiptap/pm/model"
import { TableMap } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"

import {
  canMergeCellSelection,
  getColumnMovePlan,
  getMovedBlockCellCorners,
  getRowMovePlan,
  getTableSelectionKind,
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
  type TableHeaderOverlapRect,
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

const cellAttrs = {
  colspan: { default: 1 },
  rowspan: { default: 1 },
  colwidth: { default: null },
  backgroundColor: { default: null },
}

const tableSchema = new Schema({
  nodes: {
    doc: { content: "table" },
    text: { group: "inline" },
    paragraph: { content: "text*", group: "block" },
    table: {
      content: "tableRow+",
      tableRole: "table",
      isolating: true,
    } satisfies NodeSpec,
    tableRow: {
      content: "(tableCell | tableHeader)+",
      tableRole: "row",
    } satisfies NodeSpec,
    tableCell: {
      attrs: cellAttrs,
      content: "paragraph+",
      tableRole: "cell",
      isolating: true,
    } satisfies NodeSpec,
    tableHeader: {
      attrs: cellAttrs,
      content: "paragraph+",
      tableRole: "header_cell",
      isolating: true,
    } satisfies NodeSpec,
  },
})

const paragraph = () => tableSchema.nodes.paragraph!.create()

const buildUniformTable = (width: number, height: number): Node => {
  const tableRow = tableSchema.nodes.tableRow!
  const tableCell = tableSchema.nodes.tableCell!
  const table = tableSchema.nodes.table!

  return table.create(
    null,
    Array.from({ length: height }, () =>
      tableRow.create(
        null,
        Array.from({ length: width }, () =>
          tableCell.create(null, [paragraph()]),
        ),
      ),
    ),
  )
}

const mergeSelectionRect = (
  table: Node,
  {
    top,
    bottom,
    left,
    right,
  }: {
    top: number
    bottom: number
    left: number
    right: number
  },
) => ({
  top,
  bottom,
  left,
  right,
  table,
  map: TableMap.get(table),
})

describe("canMergeCellSelection", () => {
  const rect = ({
    top,
    bottom,
    left,
    right,
    width,
    height,
  }: {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
  }) =>
    mergeSelectionRect(buildUniformTable(width, height), {
      top,
      bottom,
      left,
      right,
    })

  it("allows a single full row", () => {
    // Arrange
    const oneRow = rect({
      top: 1,
      bottom: 2,
      left: 0,
      right: 3,
      width: 3,
      height: 3,
    })

    // Act / Assert
    expect(canMergeCellSelection(oneRow)).toBe(true)
  })

  it("allows a single full column", () => {
    // Arrange
    const oneColumn = rect({
      top: 0,
      bottom: 3,
      left: 1,
      right: 2,
      width: 3,
      height: 3,
    })

    // Act / Assert
    expect(canMergeCellSelection(oneColumn)).toBe(true)
  })

  it("allows merging a one-row table across its columns", () => {
    // Arrange
    const oneRowTable = rect({
      top: 0,
      bottom: 1,
      left: 0,
      right: 2,
      width: 2,
      height: 1,
    })

    // Act / Assert
    expect(canMergeCellSelection(oneRowTable)).toBe(true)
  })

  it("refuses two or more full rows", () => {
    // Arrange
    const twoRows = rect({
      top: 1,
      bottom: 3,
      left: 0,
      right: 3,
      width: 3,
      height: 3,
    })

    // Act / Assert
    expect(canMergeCellSelection(twoRows)).toBe(false)
  })

  it("refuses two or more full columns", () => {
    // Arrange
    const twoColumns = rect({
      top: 0,
      bottom: 3,
      left: 0,
      right: 2,
      width: 3,
      height: 3,
    })

    // Act / Assert
    expect(canMergeCellSelection(twoColumns)).toBe(false)
  })

  it("allows a partial block that is not a whole row or column", () => {
    // Arrange
    const block = rect({
      top: 1,
      bottom: 3,
      left: 0,
      right: 2,
      width: 3,
      height: 3,
    })

    // Act / Assert
    expect(canMergeCellSelection(block)).toBe(true)
  })

  it("refuses a full-height column when rowspan leaves the other row with no cells", () => {
    // Arrange
    const tableRow = tableSchema.nodes.tableRow!
    const tableCell = tableSchema.nodes.tableCell!
    const table = tableSchema.nodes.table!
    const rowspanTable = table.create(null, [
      tableRow.create(null, [
        tableCell.create({ rowspan: 2 }, [paragraph()]),
        tableCell.create(null, [paragraph()]),
      ]),
      tableRow.create(null, [tableCell.create(null, [paragraph()])]),
    ])
    const columnSelection = mergeSelectionRect(rowspanTable, {
      top: 0,
      bottom: 2,
      left: 1,
      right: 2,
    })

    // Act / Assert
    expect(canMergeCellSelection(columnSelection)).toBe(false)
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
