import type { Node } from "@tiptap/pm/model"
import type { MappedTable } from "~/features/editing-experience/utils/tableHeaderAxis"
import {
  hasHeaderColumn,
  hasHeaderRow,
} from "~/features/editing-experience/utils/tableHeaderAxis"

// Builds a minimal mapped table from a row-major list of cell type names.
const mappedTable = ({
  width,
  height,
  cellTypes,
}: {
  width: number
  height: number
  cellTypes: string[]
}): MappedTable => ({
  map: { width, height, map: cellTypes.map((_, index) => index) },
  table: {
    nodeAt: (pos: number) => {
      const typeName = cellTypes[pos]
      return typeName ? { type: { name: typeName } } : null
    },
  } as Node,
})

describe("hasHeaderRow", () => {
  it("is true when every cell in the top row is a header", () => {
    const table = mappedTable({
      width: 2,
      height: 2,
      cellTypes: ["tableHeader", "tableHeader", "tableCell", "tableCell"],
    })

    expect(hasHeaderRow(table)).toBe(true)
  })

  it("is false when the top row is only partly headers", () => {
    const table = mappedTable({
      width: 2,
      height: 2,
      cellTypes: ["tableHeader", "tableCell", "tableCell", "tableCell"],
    })

    expect(hasHeaderRow(table)).toBe(false)
  })

  it("is false when the top row holds no headers at all", () => {
    const table = mappedTable({
      width: 2,
      height: 1,
      cellTypes: ["tableCell", "tableCell"],
    })

    expect(hasHeaderRow(table)).toBe(false)
  })

  it("is false for a table with no columns", () => {
    expect(
      hasHeaderRow(mappedTable({ width: 0, height: 0, cellTypes: [] })),
    ).toBe(false)
  })
})

describe("hasHeaderColumn", () => {
  it("is true when every cell in the leftmost column is a header", () => {
    const table = mappedTable({
      width: 2,
      height: 2,
      cellTypes: ["tableHeader", "tableCell", "tableHeader", "tableCell"],
    })

    expect(hasHeaderColumn(table)).toBe(true)
  })

  it("is false when the leftmost column is only partly headers", () => {
    const table = mappedTable({
      width: 2,
      height: 2,
      cellTypes: ["tableHeader", "tableCell", "tableCell", "tableCell"],
    })

    expect(hasHeaderColumn(table)).toBe(false)
  })

  it("is false for a table with no rows", () => {
    expect(
      hasHeaderColumn(mappedTable({ width: 0, height: 0, cellTypes: [] })),
    ).toBe(false)
  })
})
