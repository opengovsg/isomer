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
  getUniformBodyCellBackgroundColor,
  selectionHasBodyCell,
  setSelectedBodyCellsBackgroundColor,
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

describe("getUniformBodyCellBackgroundColor", () => {
  it("returns the token shared by all selected body cells", () => {
    // Arrange
    const doc = createTableDoc([
      [
        { type: "tableCell", backgroundColor: "blue" },
        { type: "tableCell", backgroundColor: "blue" },
      ],
    ])
    const selection = selectCells(doc, 0, 1)

    // Act
    const result = getUniformBodyCellBackgroundColor(selection)

    // Assert
    expect(result).toBe("blue")
  })

  it("returns null when all selected body cells are cleared", () => {
    // Arrange
    const doc = createTableDoc([[{ type: "tableCell" }, { type: "tableCell" }]])
    const selection = selectCells(doc, 0, 1)

    // Act
    const result = getUniformBodyCellBackgroundColor(selection)

    // Assert
    expect(result).toBeNull()
  })

  it("returns null when selected body cells disagree", () => {
    // Arrange
    const doc = createTableDoc([
      [
        { type: "tableCell", backgroundColor: "blue" },
        { type: "tableCell", backgroundColor: "green" },
      ],
    ])
    const selection = selectCells(doc, 0, 1)

    // Act
    const result = getUniformBodyCellBackgroundColor(selection)

    // Assert
    expect(result).toBeNull()
  })
})

describe("setSelectedBodyCellsBackgroundColor", () => {
  it("sets only tableCell nodes in a mixed header and body selection", () => {
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
    setSelectedBodyCellsBackgroundColor(editor, "blue")

    // Assert
    expect(dispatched).toBeDefined()
    expect(readCellColors(dispatched?.doc ?? doc)).toEqual([
      { type: "tableHeader", backgroundColor: null },
      { type: "tableHeader", backgroundColor: null },
      { type: "tableCell", backgroundColor: "blue" },
      { type: "tableCell", backgroundColor: "blue" },
    ])
  })

  it("clears backgroundColor on selected body cells", () => {
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
    setSelectedBodyCellsBackgroundColor(editor, null)

    // Assert
    expect(readCellColors(dispatched?.doc ?? doc)).toEqual([
      { type: "tableCell", backgroundColor: null },
      { type: "tableCell", backgroundColor: null },
    ])
  })
})
