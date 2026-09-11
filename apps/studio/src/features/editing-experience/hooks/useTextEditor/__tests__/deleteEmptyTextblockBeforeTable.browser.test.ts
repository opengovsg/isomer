import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { afterEach, describe, expect, it } from "vitest"
import { page, userEvent } from "vitest/browser"

import {
  BASE_EXTENSIONS,
  HEADING_TYPE,
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  PROSE_EXTENSIONS,
  TableRow,
} from "../constants"

const TABLE_BLOCK: JSONContent = {
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
              content: [{ type: "text", text: "Header" }],
            },
          ],
        },
      ],
    },
  ],
}

const createEditor = (content: JSONContent) => {
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
      IsomerHeading,
    ],
    content,
  })
}

// Position right inside the empty paragraph's content, wherever it sits.
const findEmptyParagraphPos = (editor: Editor) => {
  let pos = -1

  editor.state.doc.descendants((node, nodePos) => {
    if (pos !== -1) {
      return false
    }
    if (node.type.name !== PARAGRAPH_TYPE || node.content.size > 0) {
      return
    }
    pos = nodePos + 1
  })

  if (pos === -1) {
    throw new Error("Empty paragraph not found in document")
  }

  return pos
}

// Click so the editable gets real browser focus. Must run BEFORE
// setTextSelection, since the click otherwise repositions the caret.
const focusEditor = (editor: Editor) =>
  userEvent.click(page.elementLocator(editor.view.dom))

// Dispatch a real Backspace keydown through the view (mirrors the browser).
const pressBackspace = (editor: Editor) => {
  const event = new KeyboardEvent("keydown", {
    key: "Backspace",
    code: "Backspace",
    bubbles: true,
    cancelable: true,
  })

  editor.view.someProp("handleKeyDown", (handler) =>
    handler(editor.view, event),
  )
}

describe("Backspace before a table (real EditorView)", () => {
  let editor: Editor

  afterEach(() => {
    editor.destroy()
    document.body.replaceChildren()
  })

  it("joins backward into a preceding block instead of jumping into the table", async () => {
    // Arrange
    editor = createEditor({
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "before" }],
        },
        { type: "paragraph", attrs: { dir: null } },
        TABLE_BLOCK,
      ],
    })
    await focusEditor(editor)
    editor.commands.setTextSelection(findEmptyParagraphPos(editor))

    // Act
    pressBackspace(editor)
    await userEvent.type(page.elementLocator(editor.view.dom), "X")

    // Assert: caret joined into "before", not into the table cell
    const json = editor.getJSON()
    expect(json.content?.[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "beforeX" }],
    })
    expect(json.content?.[1]).toMatchObject({ type: "table" })
    expect(editor.state.doc.child(1).textContent).toBe("Header")
  })

  it("demotes an empty heading instead of deleting it", async () => {
    // Arrange
    editor = createEditor({
      type: "prose",
      content: [{ type: HEADING_TYPE, attrs: { level: 2 } }, TABLE_BLOCK],
    })
    await focusEditor(editor)
    editor.commands.setTextSelection(1)

    // Act
    pressBackspace(editor)

    // Assert: heading becomes a paragraph, block is not deleted
    const types = editor.getJSON().content?.map((node) => node.type)
    expect(types).toEqual([PARAGRAPH_TYPE, "table"])
  })
})
