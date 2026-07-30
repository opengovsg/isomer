import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { page, userEvent } from "vitest/browser"

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

// Click so the editable gets real browser focus (needed for clipboard checks).
const focusEditor = (editor: Editor) =>
  userEvent.click(page.elementLocator(editor.view.dom))

// Copy via the browser and return clipboard text/plain.
const copiedText = async () => {
  let captured: string | undefined
  const onCopy = (event: ClipboardEvent) => {
    captured = event.clipboardData?.getData("text/plain")
    event.preventDefault()
  }

  document.addEventListener("copy", onCopy)
  await userEvent.copy()
  document.removeEventListener("copy", onCopy)

  return captured
}

// prosemirror-keymap maps Mod to Meta on Mac and Ctrl elsewhere
// (same navigator.platform check): https://github.com/ProseMirror/prosemirror-keymap/blob/1.2.3/src/keymap.ts#L26
const isMac = /Mac|iP(hone|[oa]d)/.test(navigator.platform)

const dispatchModA = (editor: Editor) => {
  const event = new KeyboardEvent("keydown", {
    key: "a",
    code: "KeyA",
    ctrlKey: !isMac,
    metaKey: isMac,
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

  it("selects the cell under the caret", async () => {
    // Arrange
    await focusEditor(editor)
    const cellOne = findTextRange(editor, "Cell One")
    editor.commands.setTextSelection(cellOne.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(true)
    expect(selectedText(editor)).toBe("Cell One")
    expect(editor.state.selection.from).toBe(cellOne.from)
    expect(editor.state.selection.to).toBe(cellOne.to)
    expect(await copiedText()).toBe("Cell One")
  })

  it("selects the header under the caret", async () => {
    // Arrange
    await focusEditor(editor)
    const headerA = findTextRange(editor, "Header A")
    editor.commands.setTextSelection(headerA.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(true)
    expect(selectedText(editor)).toBe("Header A")
    expect(editor.state.selection.from).toBe(headerA.from)
    expect(editor.state.selection.to).toBe(headerA.to)
    expect(await copiedText()).toBe("Header A")
  })

  it("selects every paragraph in a multi-paragraph cell", async () => {
    // Arrange
    editor.destroy()
    document.body.replaceChildren()
    editor = createEditor(MULTI_PARAGRAPH_CELL_DOC)
    await focusEditor(editor)
    const firstLine = findTextRange(editor, "First line")
    editor.commands.setTextSelection(firstLine.from)

    // Act
    const handled = selectTableCellContent(editor)

    // Assert
    expect(handled).toBe(true)
    expect(selectedText(editor)).toBe("First lineSecond line")
    expect(await copiedText()).toBe("First line\n\nSecond line")
  })

  it("returns false outside a table", () => {
    // Arrange
    const beforeTable = findTextRange(editor, "before table")
    editor.commands.setTextSelection(beforeTable.from)

    // Act / Assert
    expect(selectTableCellContent(editor)).toBe(false)
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

  it("selects the current cell on Mod-a", async () => {
    // Arrange
    await focusEditor(editor)
    const cellTwo = findTextRange(editor, "Cell Two")
    editor.commands.setTextSelection(cellTwo.from)

    // Act
    dispatchModA(editor)

    // Assert
    expect(selectedText(editor)).toBe("Cell Two")
    expect(editor.state.selection.from).toBe(cellTwo.from)
    expect(editor.state.selection.to).toBe(cellTwo.to)
    expect(await copiedText()).toBe("Cell Two")
  })

  it("selects the whole document on Mod-a outside a table", () => {
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
