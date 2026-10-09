import type { JSONContent } from "@tiptap/react"
import { TableRow } from "@tiptap/extension-table-row"
import { CellSelection } from "@tiptap/pm/tables"
import { Editor } from "@tiptap/react"
import { afterEach, describe, expect, it } from "vitest"
import { duplicateSelectedColumns } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.duplicate"
import {
  BASE_EXTENSIONS,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
} from "~/features/editing-experience/hooks/useTextEditor/constants"

import { moveColumnWidth, moveTableColumnWithWidths } from "./columnWidths"

const tableDoc = (columnWidths: number[] | null): JSONContent => ({
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Widths", columnWidths },
      content: [
        {
          type: "tableRow",
          content: ["A", "B"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
        {
          type: "tableRow",
          content: ["a", "b"].map((text) => ({
            type: "tableCell",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
      ],
    },
  ],
})

const createEditor = (columnWidths: number[] | null) =>
  new Editor({
    extensions: [
      ...BASE_EXTENSIONS,
      ...PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
    ],
    content: tableDoc(columnWidths),
  })

const columnWidthsOf = (editor: Editor): number[] | null => {
  let widths: number[] | null = null
  editor.state.doc.descendants((node) => {
    if (node.type.name === "table") {
      widths = node.attrs.columnWidths as number[] | null
      return false
    }
    return true
  })
  return widths
}

const selectText = (editor: Editor, text: string) => {
  let pos = 1
  editor.state.doc.descendants((node, position) => {
    if (node.isText && node.text === text) {
      pos = position + 1
      return false
    }
    return true
  })
  editor.commands.setTextSelection(pos)
}

describe("column width edits", () => {
  const editors: Editor[] = []

  afterEach(() => {
    for (const editor of editors.splice(0)) {
      editor.destroy()
    }
  })

  const mountEditor = (columnWidths: number[] | null) => {
    const editor = createEditor(columnWidths)
    editors.push(editor)
    return editor
  }

  it("inserts the default width when a sized table gains a column", () => {
    // Arrange
    const editor = mountEditor([100, 200])
    selectText(editor, "B")

    // Act
    editor.commands.addColumnAfter()

    // Assert
    expect(columnWidthsOf(editor)).toEqual([100, 200, 160])
  })

  it("leaves automatic layout alone when a column is added", () => {
    // Arrange
    const editor = mountEditor(null)
    selectText(editor, "A")

    // Act
    editor.commands.addColumnAfter()

    // Assert
    expect(columnWidthsOf(editor)).toBeNull()
  })

  it("drops the width of a deleted column in one undo step", () => {
    // Arrange
    const editor = mountEditor([100, 200])
    selectText(editor, "A")

    // Act
    editor.commands.deleteColumn()

    // Assert
    expect(columnWidthsOf(editor)).toEqual([200])
  })

  it("copies the source width when a column is duplicated", () => {
    // Arrange
    const editor = mountEditor([100, 200])
    let cellPos = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "tableHeader" && node.textContent === "B") {
        cellPos = pos
        return false
      }
      return true
    })
    editor.view.dispatch(
      editor.state.tr.setSelection(
        CellSelection.colSelection(editor.state.doc.resolve(cellPos)),
      ),
    )

    // Act
    duplicateSelectedColumns(editor)

    // Assert
    expect(columnWidthsOf(editor)).toEqual([100, 200, 200])
  })

  it("moves a width with its column", () => {
    // Arrange
    const editor = mountEditor([100, 200])
    let tablePos = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "table") {
        tablePos = pos
        return false
      }
      return true
    })

    // Act
    moveTableColumnWithWidths({
      from: 0,
      to: 1,
      pos: tablePos + 1,
      tablePos,
      select: false,
    })(editor.state, (tr) => {
      editor.view.dispatch(tr)
    })

    // Assert
    expect(columnWidthsOf(editor)).toEqual([200, 100])
    expect(moveColumnWidth([100, 200, 300], 2, 0)).toEqual([300, 100, 200])
  })
})
