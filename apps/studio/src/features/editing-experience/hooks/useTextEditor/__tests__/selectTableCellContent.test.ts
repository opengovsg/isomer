/**
 * @vitest-environment jsdom
 */
import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  BASE_EXTENSIONS,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
  TableRow,
} from "../constants"
import { selectTableCellContent } from "../selectTableCellContent"

const TABLE_DOC: JSONContent = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "before table" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Header A" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Header B" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Cell One" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Cell Two" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "after table" }],
    },
  ],
}

const MULTI_PARAGRAPH_CELL_DOC: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First line" }],
                },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second line" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Other cell" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const createEditor = (content: JSONContent = TABLE_DOC) => {
  const element = document.createElement("div")
  document.body.append(element)

  return new Editor({
    element,
    extensions: [
      ...BASE_EXTENSIONS,
      ...PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
    ],
    content,
  })
}

const findTextRange = (editor: Editor, text: string) => {
  let from = -1
  let to = -1

  editor.state.doc.descendants((node, pos) => {
    if (from !== -1) {
      return false
    }
    if (!node.isText || node.text !== text) {
      return
    }
    from = pos
    to = pos + node.nodeSize
  })

  if (from === -1) {
    throw new Error(`Text not found in document: ${text}`)
  }

  return { from, to }
}

const selectedText = (editor: Editor) =>
  editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
  )

/** Dispatch Ctrl/Cmd+A through ProseMirror keymaps (Linux CI uses Ctrl). */
const dispatchModA = (editor: Editor) => {
  const event = new KeyboardEvent("keydown", {
    key: "a",
    code: "KeyA",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  })

  editor.view.someProp("handleKeyDown", (handler) =>
    handler(editor.view, event),
  )
}

describe("selectTableCellContent", () => {
  let editor: Editor

  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor.destroy()
    document.body.replaceChildren()
  })

  it("selects only the current table cell content when caret is inside a cell", () => {
    // Arrange
    const cellOne = findTextRange(editor, "Cell One")
    editor.commands.setTextSelection(cellOne.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(true)
    expect(selectedText(editor)).toBe("Cell One")
    expect(editor.state.selection.from).toBe(cellOne.from)
    expect(editor.state.selection.to).toBe(cellOne.to)
  })

  it("selects only the current table header content when caret is inside a header", () => {
    // Arrange
    const headerA = findTextRange(editor, "Header A")
    editor.commands.setTextSelection(headerA.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(true)
    expect(selectedText(editor)).toBe("Header A")
    expect(editor.state.selection.from).toBe(headerA.from)
    expect(editor.state.selection.to).toBe(headerA.to)
  })

  it("selects all paragraphs inside a multi-paragraph cell", () => {
    // Arrange
    editor.destroy()
    document.body.replaceChildren()
    editor = createEditor(MULTI_PARAGRAPH_CELL_DOC)
    const firstLine = findTextRange(editor, "First line")
    editor.commands.setTextSelection(firstLine.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(true)
    expect(selectedText(editor)).toBe("First lineSecond line")
  })

  it("returns false when the caret is outside a table", () => {
    // Arrange
    const beforeTable = findTextRange(editor, "before table")
    editor.commands.setTextSelection(beforeTable.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(false)
  })
})

describe("IsomerTable Mod-a shortcut", () => {
  let editor: Editor

  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor.destroy()
    document.body.replaceChildren()
  })

  it("selects cell content via Mod-a when inside a table cell", () => {
    // Arrange
    const cellTwo = findTextRange(editor, "Cell Two")
    editor.commands.setTextSelection(cellTwo.from)

    // Act
    dispatchModA(editor)

    // Assert
    expect(selectedText(editor)).toBe("Cell Two")
    expect(editor.state.selection.from).toBe(cellTwo.from)
    expect(editor.state.selection.to).toBe(cellTwo.to)
  })

  it("still selects the entire document via Mod-a outside a table", () => {
    // Arrange
    const beforeTable = findTextRange(editor, "before table")
    editor.commands.setTextSelection(beforeTable.from)

    // Act
    dispatchModA(editor)

    // Assert
    expect(editor.state.selection.constructor.name).toBe("AllSelection")
    expect(editor.state.selection.from).toBe(0)
    expect(editor.state.selection.to).toBe(editor.state.doc.content.size)
  })
})
