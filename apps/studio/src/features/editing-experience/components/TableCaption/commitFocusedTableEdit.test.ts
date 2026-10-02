import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"
import { afterEach, describe, expect, it } from "vitest"
import {
  BASE_EXTENSIONS,
  HEADING_TYPE,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  PROSE_EXTENSIONS,
  TableRow,
} from "~/features/editing-experience/hooks/useTextEditor/constants"

import { commitFocusedTableEdit } from "./commitFocusedTableEdit"

const tableBlock = (text: string): JSONContent => ({
  type: "table",
  attrs: { caption: text },
  content: [
    {
      type: "tableRow",
      content: [
        {
          type: "tableCell",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        },
      ],
    },
  ],
})

const createEditor = (content: JSONContent) =>
  new Editor({
    extensions: [
      ...BASE_EXTENSIONS,
      ...PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
      TextDirection.configure({
        types: [HEADING_TYPE, PARAGRAPH_TYPE],
      }),
    ],
    content,
  })

const tablePositions = (editor: Editor) => {
  const positions: number[] = []
  editor.state.doc.forEach((node, offset) => {
    if (node.type.name === "table") positions.push(offset)
  })
  return positions
}

describe("commitFocusedTableEdit", () => {
  const editors: Editor[] = []

  afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy())
  })

  it("replaces only the table at the given position", () => {
    // Arrange
    const editor = createEditor({
      type: "prose",
      content: [
        tableBlock("First"),
        {
          type: "paragraph",
          content: [{ type: "text", text: "between" }],
        },
        tableBlock("Second"),
      ],
    })
    editors.push(editor)
    const positions = tablePositions(editor)
    const updatedTable = tableBlock("Updated cell")
    updatedTable.attrs = { caption: "Second updated" }
    // The modal document contains only the table being edited.
    const nextDoc: JSONContent = { type: "prose", content: [updatedTable] }

    // Act
    commitFocusedTableEdit(editor, () => positions[1], nextDoc)

    // Assert
    const captions: string[] = []
    const cellTexts: string[] = []
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") {
        captions.push(String(node.attrs.caption ?? ""))
      }
      if (node.type.name === "tableCell") {
        cellTexts.push(node.textContent)
      }
    })
    expect(captions).toEqual(["First", "Second updated"])
    expect(cellTexts).toEqual(["First", "Updated cell"])
    expect(editor.getText()).toContain("between")
  })

  it("does not add an undo step when the table is unchanged", () => {
    // Arrange
    const editor = createEditor({
      type: "prose",
      content: [tableBlock("Same")],
    })
    editors.push(editor)
    const before = editor.getJSON()

    // Act
    commitFocusedTableEdit(editor, () => tablePositions(editor)[0], before)

    // Assert
    expect(editor.getJSON()).toEqual(before)
    expect(editor.can().undo()).toBe(false)
  })
})
