import type { Node as ProseMirrorNode, NodeSpec } from "@tiptap/pm/model"
import type { Editor } from "@tiptap/react"
import { Schema } from "@tiptap/pm/model"
import { EditorState, type Transaction } from "@tiptap/pm/state"
import { CellSelection } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"

import {
  getSelectionBackgroundColorState,
  setSelectedCellsBackgroundColor,
} from "../TableBubbleMenu.backgroundColor"

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

interface CellDefinition {
  type: "tableCell" | "tableHeader"
  backgroundColor?: string | null
}

const createTableDoc = (rows: CellDefinition[][]): ProseMirrorNode => {
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

const cellPositions = (doc: ProseMirrorNode): number[] => {
  const positions: number[] = []
  doc.descendants((node, pos) => {
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      positions.push(pos)
      return false
    }
    return true
  })
  return positions
}

const selectCells = (
  doc: ProseMirrorNode,
  anchorIndex: number,
  headIndex: number,
): CellSelection => {
  const positions = cellPositions(doc)
  const anchor = positions[anchorIndex]
  const head = positions[headIndex]
  if (anchor === undefined || head === undefined) {
    throw new Error("Cell index is outside the test table")
  }
  return CellSelection.create(doc, anchor, head)
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

const createEditor = (doc: ProseMirrorNode, selection: CellSelection) => {
  const state = EditorState.create({ doc, selection })
  let dispatched: Transaction | undefined
  const editor = {
    state,
    view: {
      dispatch: (transaction: Transaction) => {
        dispatched = transaction
      },
    },
  } as unknown as Editor

  return {
    editor,
    getDispatched: () => dispatched,
  }
}

describe("getSelectionBackgroundColorState", () => {
  it("reports uniform colour on header-only selections", () => {
    const doc = createTableDoc([
      [
        { type: "tableHeader", backgroundColor: "blue" },
        { type: "tableHeader", backgroundColor: "blue" },
      ],
    ])

    expect(getSelectionBackgroundColorState(selectCells(doc, 0, 1))).toEqual({
      isUniform: true,
      uniformColor: "blue",
    })
  })

  it("reports uniform colour on body-only selections", () => {
    const doc = createTableDoc([[{ type: "tableCell" }, { type: "tableCell" }]])
    expect(getSelectionBackgroundColorState(selectCells(doc, 0, 1))).toEqual({
      isUniform: true,
      uniformColor: null,
    })
  })

  it("reports uniform colour on mixed header and body selections", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
      [{ type: "tableCell" }, { type: "tableCell" }],
    ])
    expect(getSelectionBackgroundColorState(selectCells(doc, 0, 3))).toEqual({
      isUniform: true,
      uniformColor: null,
    })
  })

  it("reports isUniform false when selected cells have different colours", () => {
    const doc = createTableDoc([
      [
        { type: "tableCell", backgroundColor: "blue" },
        { type: "tableCell", backgroundColor: "pink" },
      ],
    ])

    expect(getSelectionBackgroundColorState(selectCells(doc, 0, 1))).toEqual({
      isUniform: false,
      uniformColor: null,
    })
  })
})

describe("setSelectedCellsBackgroundColor", () => {
  it("sets backgroundColor on every selected body cell", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
      [{ type: "tableCell" }, { type: "tableCell" }],
    ])
    const { editor, getDispatched } = createEditor(doc, selectCells(doc, 2, 3))

    setSelectedCellsBackgroundColor(editor, "blue")

    expect(getDispatched()).toBeDefined()
    expect(readCellColors(getDispatched()?.doc ?? doc)).toEqual([
      { type: "tableHeader", backgroundColor: null },
      { type: "tableHeader", backgroundColor: null },
      { type: "tableCell", backgroundColor: "blue" },
      { type: "tableCell", backgroundColor: "blue" },
    ])
  })

  it("sets backgroundColor on header-only selections", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
    ])
    const { editor, getDispatched } = createEditor(doc, selectCells(doc, 0, 1))

    setSelectedCellsBackgroundColor(editor, "purple")

    expect(readCellColors(getDispatched()?.doc ?? doc)).toEqual([
      { type: "tableHeader", backgroundColor: "purple" },
      { type: "tableHeader", backgroundColor: "purple" },
    ])
  })

  it("sets backgroundColor on mixed header and body selections", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
      [{ type: "tableCell" }, { type: "tableCell" }],
    ])
    const { editor, getDispatched } = createEditor(doc, selectCells(doc, 0, 3))

    setSelectedCellsBackgroundColor(editor, "green")

    expect(readCellColors(getDispatched()?.doc ?? doc)).toEqual([
      { type: "tableHeader", backgroundColor: "green" },
      { type: "tableHeader", backgroundColor: "green" },
      { type: "tableCell", backgroundColor: "green" },
      { type: "tableCell", backgroundColor: "green" },
    ])
  })

  it("clears backgroundColor on selected cells", () => {
    const doc = createTableDoc([
      [
        { type: "tableCell", backgroundColor: "purple" },
        { type: "tableCell", backgroundColor: "purple" },
      ],
    ])
    const { editor, getDispatched } = createEditor(doc, selectCells(doc, 0, 1))

    setSelectedCellsBackgroundColor(editor, null)

    expect(readCellColors(getDispatched()?.doc ?? doc)).toEqual([
      { type: "tableCell", backgroundColor: null },
      { type: "tableCell", backgroundColor: null },
    ])
  })
})
