import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"

import {
  BASE_EXTENSIONS,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
  TableRow,
} from "../constants"
import { tryFocusBelowEditorContent } from "../ensureTrailingParagraphAfterTable"

const TABLE_ONLY_DOC: JSONContent = {
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
                  content: [{ type: "text", text: "Cell" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const createEditor = (content: JSONContent = TABLE_ONLY_DOC) => {
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

describe("tryFocusBelowEditorContent", () => {
  let editor: Editor

  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor.destroy()
    document.body.replaceChildren()
  })

  it("keeps a table-last document unchanged on load", () => {
    // Assert
    expect(editor.state.doc.lastChild?.type.name).toBe("table")
  })

  it("adds a paragraph after a click below the table", async () => {
    // Arrange
    const dom = editor.view.dom
    const rect = dom.getBoundingClientRect()
    const contentEndBottom = editor.view.coordsAtPos(
      editor.state.doc.content.size - 1,
    ).bottom

    // Act
    tryFocusBelowEditorContent(
      editor.view,
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 16,
        clientY: contentEndBottom + 40,
        button: 0,
      }),
    )
    await userEvent.keyboard("typed below")

    // Assert
    expect(editor.getText()).toContain("typed below")
    expect(editor.state.doc.lastChild?.type.name).toBe("paragraph")
  })
})
