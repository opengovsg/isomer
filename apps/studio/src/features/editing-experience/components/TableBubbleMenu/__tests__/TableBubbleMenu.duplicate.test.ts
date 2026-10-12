import type { Node as ProseMirrorNode, NodeSpec } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { Schema } from "@tiptap/pm/model"
import { EditorState } from "@tiptap/pm/state"
import { selectedRect, TableMap } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"

import {
  getSelectionHandleTarget,
  selectWholeSlot,
} from "../../TableDragHandles/internal/selection"
import { duplicateSelectedRows } from "../TableBubbleMenu.duplicate"

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
      content: "tableCell+",
      tableRole: "row",
    } satisfies NodeSpec,
    tableCell: {
      attrs: cellAttrs,
      content: "paragraph+",
      tableRole: "cell",
      isolating: true,
    } satisfies NodeSpec,
  },
})

const cell = (text: string, attrs?: { colspan?: number; rowspan?: number }) =>
  schema.nodes.tableCell.create(
    {
      colspan: attrs?.colspan ?? 1,
      rowspan: attrs?.rowspan ?? 1,
      colwidth: null,
    },
    schema.nodes.paragraph.create(null, schema.text(text)),
  )

const row = (...cells: ProseMirrorNode[]) =>
  schema.nodes.tableRow.create(null, cells)

const tableDoc = (...rows: ProseMirrorNode[]) =>
  schema.nodes.doc.create(null, schema.nodes.table.create(null, rows))

const editorFor = (doc: ProseMirrorNode) => {
  let state = EditorState.create({ doc, schema })
  const editor = {
    get state() {
      return state
    },
    view: {
      dispatch(transaction: Transaction) {
        state = state.apply(transaction)
      },
      focus() {},
    },
    isDestroyed: false,
    chain: () => ({
      focus: () => ({
        run: () => true,
      }),
    }),
    commands: { focus: () => {} },
  }
  return editor as unknown as TiptapEditor
}

const rowTextsAt = (editor: TiptapEditor, rowIndex: number) => {
  const table = editor.state.doc.firstChild
  if (!table) return []
  const rowNode = table.child(rowIndex)
  const texts: string[] = []
  rowNode.forEach((cell) => {
    texts.push(cell.textContent)
  })
  return texts
}

describe("duplicateSelectedRows", () => {
  it("duplicates a row beside a vertical merge in the last column", () => {
    // Arrange
    const editor = editorFor(
      tableDoc(
        row(cell("r0a"), cell("r0b"), cell("span", { rowspan: 3 })),
        row(cell("r1a"), cell("r1b")),
        row(cell("r2a"), cell("r2b")),
        row(cell("r3a"), cell("r3b")),
      ),
    )
    selectWholeSlot(editor, 0, "row", 1)
    const heightBefore = TableMap.get(editor.state.doc.firstChild!).height

    // Act
    duplicateSelectedRows(editor)

    // Assert
    const table = editor.state.doc.firstChild
    if (!table) throw new Error("missing table")
    expect(TableMap.get(table).height).toBe(heightBefore + 1)
    expect(rowTextsAt(editor, 2)).toEqual(["r1a", "r1b"])
    expect(getSelectionHandleTarget(editor)?.rows).toEqual([2])
    const rect = selectedRect(editor.state)
    expect(rect.top).toBe(2)
    expect(rect.bottom).toBe(3)
  })
})
