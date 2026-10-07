import type { Node as ProseMirrorNode, NodeSpec } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { Schema } from "@tiptap/pm/model"
import { EditorState } from "@tiptap/pm/state"
import { CellSelection, selectedRect, TableMap } from "@tiptap/pm/tables"
import { describe, expect, it } from "vitest"
import { detectTableSelectionKind } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.utils"

import { getSelectionHandleTarget, selectWholeSlot } from "../selection"

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
  }
  return editor as unknown as TiptapEditor
}

const selectedTexts = (editor: TiptapEditor) => {
  const texts: string[] = []
  const { selection } = editor.state
  if (selection instanceof CellSelection) {
    selection.forEachCell((node) => {
      texts.push(node.textContent)
    })
  }
  return texts
}

describe("selectWholeSlot", () => {
  it("selects the clicked row when the first column spans the whole table", () => {
    // Arrange
    const editor = editorFor(
      tableDoc(
        row(cell("span", { rowspan: 4 }), cell("r0b"), cell("r0c")),
        row(cell("r1b"), cell("r1c")),
        row(cell("r2b"), cell("r2c")),
        row(cell("r3b"), cell("r3c")),
      ),
    )

    // Act
    selectWholeSlot(editor, 0, "row", 2)

    // Assert
    const rect = selectedRect(editor.state)
    expect(rect.top).toBe(2)
    expect(rect.bottom).toBe(3)
    expect(selectedTexts(editor).sort()).toEqual(["r2b", "r2c"])
    expect((editor.state.selection as CellSelection).isColSelection()).toBe(
      false,
    )
    expect(detectTableSelectionKind(editor)).toBe("row")
    expect(getSelectionHandleTarget(editor)).toEqual({
      tablePos: 0,
      rows: [2],
      cols: [],
    })
  })

  it("selects the clicked row when the first column spans two rows", () => {
    // Arrange
    const editor = editorFor(
      tableDoc(
        row(cell("r0a"), cell("r0b"), cell("r0c")),
        row(cell("span", { rowspan: 2 }), cell("r1b"), cell("r1c")),
        row(cell("r2b"), cell("r2c")),
        row(cell("r3a"), cell("r3b"), cell("r3c")),
      ),
    )

    // Act
    selectWholeSlot(editor, 0, "row", 1)

    // Assert
    const rect = selectedRect(editor.state)
    expect(rect.top).toBe(1)
    expect(rect.bottom).toBe(2)
    expect(selectedTexts(editor).sort()).toEqual(["r1b", "r1c"])
    expect(detectTableSelectionKind(editor)).toBe("row")
    expect(getSelectionHandleTarget(editor)?.rows).toEqual([1])
  })

  it("selects the full row when no cells are merged", () => {
    // Arrange
    const editor = editorFor(
      tableDoc(
        row(cell("r0a"), cell("r0b"), cell("r0c")),
        row(cell("r1a"), cell("r1b"), cell("r1c")),
        row(cell("r2a"), cell("r2b"), cell("r2c")),
      ),
    )

    // Act
    selectWholeSlot(editor, 0, "row", 1)

    // Assert
    const rect = selectedRect(editor.state)
    expect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
    }).toEqual({
      top: 1,
      bottom: 2,
      left: 0,
      right: 3,
    })
    expect(selectedTexts(editor).sort()).toEqual(["r1a", "r1b", "r1c"])
    expect((editor.state.selection as CellSelection).isRowSelection()).toBe(
      true,
    )
    expect(detectTableSelectionKind(editor)).toBe("row")
    expect(getSelectionHandleTarget(editor)?.rows).toEqual([1])
  })

  it("keeps a vertical merge outside the first column inside that row", () => {
    // Arrange
    const editor = editorFor(
      tableDoc(
        row(cell("r0a"), cell("r0b"), cell("r0c")),
        row(cell("r1a"), cell("span", { rowspan: 2 }), cell("r1c")),
        row(cell("r2a"), cell("r2c")),
        row(cell("r3a"), cell("r3b"), cell("r3c")),
      ),
    )

    // Act
    selectWholeSlot(editor, 0, "row", 1)

    // Assert
    const rect = selectedRect(editor.state)
    expect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
    }).toEqual({
      top: 1,
      bottom: 2,
      left: 0,
      right: 3,
    })
    expect(selectedTexts(editor).sort()).toEqual(["r1a", "r1c", "span"])
    expect(detectTableSelectionKind(editor)).toBe("row")
    expect(getSelectionHandleTarget(editor)?.rows).toEqual([1])
  })

  it("does not treat one cell of an unmerged row as that row", () => {
    // Arrange
    const doc = tableDoc(
      row(cell("r0a"), cell("r0b"), cell("r0c")),
      row(cell("r1a"), cell("r1b"), cell("r1c")),
    )
    const table = doc.firstChild
    if (!table) throw new Error("missing table")
    const cellPos = 1 + TableMap.get(table).positionAt(1, 1, table)
    const editor = editorFor(doc)

    // Act
    editor.view.dispatch(
      editor.state.tr.setSelection(CellSelection.create(doc, cellPos)),
    )

    // Assert
    expect(detectTableSelectionKind(editor)).toBe("single-cell")
    expect(getSelectionHandleTarget(editor)).toBeNull()
  })

  it("selects one column when two cells in a body row are merged", () => {
    // Arrange
    const editor = editorFor(
      tableDoc(
        row(cell("r0a"), cell("r0b"), cell("r0c")),
        row(cell("span", { colspan: 2 }), cell("r1c")),
        row(cell("r2a"), cell("r2b"), cell("r2c")),
      ),
    )

    // Act
    selectWholeSlot(editor, 0, "column", 0)

    // Assert
    const rect = selectedRect(editor.state)
    expect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
    }).toEqual({
      top: 0,
      bottom: 3,
      left: 0,
      right: 1,
    })
    expect((editor.state.selection as CellSelection).isColSelection()).toBe(
      true,
    )
    expect((editor.state.selection as CellSelection).isRowSelection()).toBe(
      false,
    )
    expect(detectTableSelectionKind(editor)).toBe("column")
    expect(getSelectionHandleTarget(editor)?.cols).toEqual([0])
  })
})
