import type { JSONContent } from "@tiptap/react"
import { TableRow } from "@tiptap/extension-table-row"
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
} from "~/features/editing-experience/hooks/useTextEditor/constants"

import {
  getExpandedTablePos,
  setTableEditorExpanded,
} from "./expandTableEditor"

const tableBlock = (text: string): JSONContent => ({
  type: "table",
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

const documentWithTable = (): JSONContent => ({
  type: "prose",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "before" }] },
    tableBlock("cell"),
    { type: "paragraph", content: [{ type: "text", text: "after" }] },
  ],
})

const createEditor = () => {
  const element = document.createElement("div")
  document.body.appendChild(element)
  return new Editor({
    element,
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
    content: documentWithTable(),
  })
}

const tableLocation = (editor: Editor) => {
  let found: { pos: number; size: number } | undefined
  editor.state.doc.descendants((node, pos) => {
    if (found) return false
    if (node.type.name !== "table") return true
    found = { pos, size: node.nodeSize }
    return false
  })
  if (!found) throw new Error("expected a table")
  return found
}

const textPos = (editor: Editor, text: string) => {
  let found: number | undefined
  editor.state.doc.descendants((node, pos) => {
    if (found !== undefined) return false
    if (node.isText && node.text === text) {
      found = pos
      return false
    }
    return true
  })
  if (found === undefined) throw new Error(`expected text "${text}"`)
  return found
}

describe("expanded table editor", () => {
  let editor: Editor

  afterEach(() => {
    editor.destroy()
  })

  it("pulls a selection that crosses the table back inside it", () => {
    // Arrange
    editor = createEditor()
    const table = tableLocation(editor)
    editor.commands.setTextSelection({
      from: textPos(editor, "cell"),
      to: textPos(editor, "after") + 1,
    })
    expect(editor.state.selection.to).toBeGreaterThan(table.pos + table.size)

    // Act
    setTableEditorExpanded(editor, table.pos)

    // Assert
    const { from, to } = editor.state.selection
    expect(from).toBeGreaterThanOrEqual(table.pos)
    expect(to).toBeLessThanOrEqual(table.pos + table.size)
    expect(editor.state.doc.textContent).toContain("before")
    expect(editor.state.doc.textContent).toContain("after")
  })

  it("keeps an edit before the table when undo runs while expanded", () => {
    // Arrange
    editor = createEditor()
    editor.commands.setTextSelection(textPos(editor, "before"))
    editor.commands.insertContent("X")
    const table = tableLocation(editor)
    setTableEditorExpanded(editor, table.pos)
    const text = editor.state.doc.textContent

    // Act
    editor.commands.undo()

    // Assert
    expect(editor.state.doc.textContent).toBe(text)
    expect(getExpandedTablePos(editor)).toBe(table.pos)
    expect(editor.state.doc.nodeAt(table.pos)?.type.name).toBe("table")
  })

  it("undoes an edit made inside the expanded table", () => {
    // Arrange
    editor = createEditor()
    const table = tableLocation(editor)
    setTableEditorExpanded(editor, table.pos)
    editor.commands.insertContent("Q")

    // Act
    editor.commands.undo()

    // Assert
    expect(editor.state.doc.textContent).not.toContain("Q")
    expect(editor.state.doc.textContent).toContain("before")
    expect(editor.state.doc.textContent).toContain("after")
    expect(getExpandedTablePos(editor)).toBe(table.pos)
  })

  it("rejects a replacement outside the expanded table", () => {
    // Arrange
    editor = createEditor()
    const table = tableLocation(editor)
    setTableEditorExpanded(editor, table.pos)
    const after = textPos(editor, "after")
    const text = editor.state.doc.textContent

    // Act
    editor.view.dispatch(
      editor.state.tr.insertText("Z", after, after + "after".length),
    )

    // Assert
    expect(editor.state.doc.textContent).toBe(text)
  })

  it("rejects an insert on either edge of the expanded table", () => {
    // Arrange
    editor = createEditor()
    const table = tableLocation(editor)
    setTableEditorExpanded(editor, table.pos)
    const text = editor.state.doc.textContent
    const paragraphNode = editor.state.schema.nodes.paragraph
    if (!paragraphNode) throw new Error("Invalid test schema")
    const paragraph = paragraphNode.create(null, editor.state.schema.text("Z"))

    // Act
    editor.view.dispatch(editor.state.tr.insert(table.pos, paragraph))
    editor.view.dispatch(
      editor.state.tr.insert(table.pos + table.size, paragraph),
    )

    // Assert
    expect(editor.state.doc.textContent).toBe(text)
  })

  it("closes expansion when the expanded table is deleted", () => {
    // Arrange
    editor = createEditor()
    const table = tableLocation(editor)
    setTableEditorExpanded(editor, table.pos)

    // Act
    const deleted = editor.commands.deleteTable()

    // Assert
    expect(deleted).toBe(true)
    expect(getExpandedTablePos(editor)).toBeNull()
    expect(editor.state.doc.textContent).toContain("before")
    expect(editor.state.doc.textContent).toContain("after")
    expect(editor.state.doc.textContent).not.toContain("cell")
  })
})
