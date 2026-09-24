import type { Node as ProseMirrorNode, NodeSpec } from "@tiptap/pm/model"
import { Schema } from "@tiptap/pm/model"
import { EditorState } from "@tiptap/pm/state"
import { moveTableColumn, moveTableRow, TableMap } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"
import {
  hasHeaderColumn,
  hasHeaderRow,
} from "~/features/editing-experience/utils/tableHeaderAxis"

import { getTableAt } from "../axisTableOps"
import {
  applyHeaderAxisNormalization,
  getHeaderAxisFlags,
  shouldNormalizeHeaderTypesAfterDrag,
} from "../normalizeHeaderAxis"

const cellAttrs = {
  colspan: { default: 1 },
  rowspan: { default: 1 },
  colwidth: { default: null },
}

const schema = new Schema({
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

const createTableDoc = (
  rows: ("tableCell" | "tableHeader")[][],
  attrs?: { colspan?: number; rowspan?: number }[][],
): ProseMirrorNode => {
  const paragraph = schema.nodes.paragraph
  const tableRow = schema.nodes.tableRow
  const table = schema.nodes.table
  if (!paragraph || !tableRow || !table) throw new Error("Invalid test schema")

  return schema.node("doc", null, [
    table.create(
      null,
      rows.map((row, rowIndex) =>
        tableRow.create(
          null,
          row.map((type, colIndex) => {
            const cellAttr = attrs?.[rowIndex]?.[colIndex] ?? {}
            return schema.node(
              type,
              {
                colspan: cellAttr.colspan ?? 1,
                rowspan: cellAttr.rowspan ?? 1,
                colwidth: null,
              },
              [paragraph.create()],
            )
          }),
        ),
      ),
    ),
  ])
}

const tablePos = () => 0

const mappedTable = (doc: ProseMirrorNode) => {
  const table = getTableAt(doc, tablePos())!
  return { map: TableMap.get(table), table }
}

const cellTypesInOrder = (doc: ProseMirrorNode): string[] => {
  const types: string[] = []
  doc.descendants((node) => {
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      types.push(node.type.name)
      return false
    }
    return true
  })
  return types
}

const headerRowAndColumnTable = () =>
  createTableDoc([
    Array.from({ length: 4 }, () => "tableHeader"),
    ["tableHeader", "tableCell", "tableCell", "tableCell"],
    ["tableHeader", "tableCell", "tableCell", "tableCell"],
    ["tableHeader", "tableCell", "tableCell", "tableCell"],
  ])

describe("shouldNormalizeHeaderTypesAfterDrag", () => {
  it("skips row-drag normalization when only a header column is set", () => {
    expect(
      shouldNormalizeHeaderTypesAfterDrag("row", {
        preserveHeaderRow: false,
        preserveHeaderColumn: true,
      }),
    ).toBe(false)
  })
})

describe("applyHeaderAxisNormalization", () => {
  it("keeps header row and header column after a body row reorder", () => {
    // Arrange
    const doc = headerRowAndColumnTable()
    const state = EditorState.create({ schema, doc })
    const flags = getHeaderAxisFlags(getTableAt(state.doc, tablePos())!)

    // Act
    let tr = state.tr
    moveTableRow({ from: 3, to: 2, pos: tablePos() + 1 })(state, (next) => {
      tr = next
      return true
    })
    tr = applyHeaderAxisNormalization(tr, tablePos(), flags, schema)

    // Assert
    const after = EditorState.create({ schema, doc: tr.doc })
    expect(hasHeaderRow(mappedTable(after.doc))).toBe(true)
    expect(hasHeaderColumn(mappedTable(after.doc))).toBe(true)
    expect(
      cellTypesInOrder(after.doc).filter((t) => t === "tableHeader").length,
    ).toBe(7)
  })

  it("keeps header row and header column after swapping columns 3 and 4", () => {
    // Arrange
    const doc = headerRowAndColumnTable()
    const state = EditorState.create({ schema, doc })
    const flags = getHeaderAxisFlags(getTableAt(state.doc, tablePos())!)

    // Act
    let tr = state.tr
    moveTableColumn({ from: 3, to: 2, pos: tablePos() + 1 })(state, (next) => {
      tr = next
      return true
    })
    tr = applyHeaderAxisNormalization(tr, tablePos(), flags, schema)

    // Assert
    const after = EditorState.create({ schema, doc: tr.doc })
    expect(hasHeaderRow(mappedTable(after.doc))).toBe(true)
    expect(hasHeaderColumn(mappedTable(after.doc))).toBe(true)
    expect(
      cellTypesInOrder(after.doc).filter((t) => t === "tableHeader").length,
    ).toBe(7)
  })

})
