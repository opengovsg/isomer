import type { Node as ProseMirrorNode, NodeSpec } from "@tiptap/pm/model"
import type { Editor } from "@tiptap/react"
import { BulletList } from "@tiptap/extension-bullet-list"
import { Document } from "@tiptap/extension-document"
import { ListItem } from "@tiptap/extension-list-item"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Text } from "@tiptap/extension-text"
import { Schema } from "@tiptap/pm/model"
import { EditorState, type Transaction } from "@tiptap/pm/state"
import { CellSelection } from "@tiptap/pm/tables"
import { getSchema } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import {
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  TableRow,
} from "../../hooks/useTextEditor/constants"
import {
  selectionCanSetBackgroundColour,
  selectionHasBodyCell,
  setSelectedCellsBackgroundColor,
} from "./tableCellBackgroundColor"

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

describe("IsomerTableCell", () => {
  it("preserves TipTap table cell span attributes when extended", () => {
    // Arrange / Act
    const tableSchema = getSchema([
      Document,
      Text,
      Paragraph,
      BulletList,
      ListItem,
      IsomerTable,
      TableRow,
      IsomerTableCell,
      IsomerTableHeader,
    ])
    const attributes = tableSchema.nodes.tableCell?.spec.attrs

    // Assert
    expect(attributes).toMatchObject({
      colspan: { default: 1 },
      rowspan: { default: 1 },
      backgroundColor: { default: null },
    })
  })
})

describe("selectionHasBodyCell", () => {
  it("returns true for a body-only selection", () => {
    // Arrange
    const doc = createTableDoc([[{ type: "tableCell" }, { type: "tableCell" }]])
    const selection = selectCells(doc, 0, 1)

    // Act
    const result = selectionHasBodyCell(selection)

    // Assert
    expect(result).toBe(true)
  })

  it("returns false for a header-only selection", () => {
    // Arrange
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
    ])
    const selection = selectCells(doc, 0, 1)

    // Act
    const result = selectionHasBodyCell(selection)

    // Assert
    expect(result).toBe(false)
  })
})

describe("selectionCanSetBackgroundColour", () => {
  it("returns true for body-only selections", () => {
    const doc = createTableDoc([[{ type: "tableCell" }, { type: "tableCell" }]])
    expect(selectionCanSetBackgroundColour(selectCells(doc, 0, 1))).toBe(true)
  })

  it("returns true for header-only selections", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
    ])
    expect(selectionCanSetBackgroundColour(selectCells(doc, 0, 1))).toBe(true)
  })

  it("returns false for mixed header and body selections", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
      [{ type: "tableCell" }, { type: "tableCell" }],
    ])
    expect(selectionCanSetBackgroundColour(selectCells(doc, 0, 3))).toBe(false)
  })
})

describe("setSelectedCellsBackgroundColor", () => {
  it("sets backgroundColor on every selected cell", () => {
    // Arrange
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
      [{ type: "tableCell" }, { type: "tableCell" }],
    ])
    const selection = selectCells(doc, 0, 3)
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

    // Act
    setSelectedCellsBackgroundColor(editor, "blue")

    // Assert — schema allows any token on any cell; Studio only filters the UI
    expect(dispatched).toBeDefined()
    expect(readCellColors(dispatched?.doc ?? doc)).toEqual([
      { type: "tableHeader", backgroundColor: "blue" },
      { type: "tableHeader", backgroundColor: "blue" },
      { type: "tableCell", backgroundColor: "blue" },
      { type: "tableCell", backgroundColor: "blue" },
    ])
  })

  it("clears backgroundColor on selected cells", () => {
    // Arrange
    const doc = createTableDoc([
      [
        { type: "tableCell", backgroundColor: "purple" },
        { type: "tableCell", backgroundColor: "purple" },
      ],
    ])
    const selection = selectCells(doc, 0, 1)
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

    // Act
    setSelectedCellsBackgroundColor(editor, null)

    // Assert
    expect(readCellColors(dispatched?.doc ?? doc)).toEqual([
      { type: "tableCell", backgroundColor: null },
      { type: "tableCell", backgroundColor: null },
    ])
  })

  it("can set brand inverse on header cells", () => {
    const doc = createTableDoc([
      [{ type: "tableHeader" }, { type: "tableHeader" }],
    ])
    const selection = selectCells(doc, 0, 1)
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

    setSelectedCellsBackgroundColor(editor, "brand.canvas.inverse")

    expect(readCellColors(dispatched?.doc ?? doc)).toEqual([
      { type: "tableHeader", backgroundColor: "brand.canvas.inverse" },
      { type: "tableHeader", backgroundColor: "brand.canvas.inverse" },
    ])
  })
})
