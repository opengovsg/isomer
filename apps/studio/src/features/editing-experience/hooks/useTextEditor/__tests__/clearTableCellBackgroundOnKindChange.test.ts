import type { Node as ProseMirrorNode, NodeSpec } from "@tiptap/pm/model"
import { Schema } from "@tiptap/pm/model"
import { EditorState } from "@tiptap/pm/state"
import { describe, expect, it } from "vitest"

import { appendClearBackgroundOnCellKindChange } from "../clearTableCellBackgroundOnKindChange"

const cellAttrs = {
  colspan: { default: 1 },
  rowspan: { default: 1 },
  colwidth: { default: null },
  backgroundColor: { default: null },
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
  rows: {
    type: "tableCell" | "tableHeader"
    backgroundColor?: string | null
  }[][],
): ProseMirrorNode => {
  const paragraph = schema.nodes.paragraph
  const tableRow = schema.nodes.tableRow
  const table = schema.nodes.table
  if (!paragraph || !tableRow || !table) throw new Error("Invalid test schema")

  return schema.node("doc", null, [
    table.create(
      null,
      rows.map((row) =>
        tableRow.create(
          null,
          row.map(({ type, backgroundColor = null }) =>
            schema.node(type, { backgroundColor }, [paragraph.create()]),
          ),
        ),
      ),
    ),
  ])
}

const readCellColors = (doc: ProseMirrorNode) => {
  const colors: { type: string; backgroundColor: unknown }[] = []
  doc.descendants((node) => {
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      colors.push({
        type: node.type.name,
        backgroundColor: node.attrs.backgroundColor,
      })
      return false
    }
    return true
  })
  return colors
}

describe("appendClearBackgroundOnCellKindChange", () => {
  it("clears backgroundColor on cells that changed kind in the transaction", () => {
    const beforeDoc = createTableDoc([
      [{ type: "tableHeader", backgroundColor: "blue" }],
      [{ type: "tableCell", backgroundColor: "pink" }],
    ])

    const afterDoc = createTableDoc([
      [{ type: "tableCell", backgroundColor: "blue" }],
      [{ type: "tableCell", backgroundColor: "pink" }],
    ])

    const state = EditorState.create({ doc: afterDoc })
    const transaction = state.tr
    appendClearBackgroundOnCellKindChange(beforeDoc, transaction)

    expect(readCellColors(transaction.doc)).toEqual([
      { type: "tableCell", backgroundColor: null },
      { type: "tableCell", backgroundColor: "pink" },
    ])
  })
})
