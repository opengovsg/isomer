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
import { ensureTrailingParagraphAfterTablePlugin } from "../ensureTrailingParagraphAfterTable"

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

const mousedownBelowTable = (editor: Editor) => {
  const dom = editor.view.dom
  const rect = dom.getBoundingClientRect()
  const contentEndBottom = editor.view.coordsAtPos(
    editor.state.doc.content.size - 1,
  ).bottom

  const event = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + 16,
    clientY: contentEndBottom + 40,
    button: 0,
  })
  const mousedown =
    ensureTrailingParagraphAfterTablePlugin.props.handleDOMEvents?.mousedown
  return mousedown?.call(
    ensureTrailingParagraphAfterTablePlugin,
    editor.view,
    event,
  )
}

describe("ensureTrailingParagraphAfterTablePlugin", () => {
  let editor: Editor

  beforeEach(() => {
    editor = createEditor()
  })

  afterEach(() => {
    editor.destroy()
    document.body.replaceChildren()
  })

  it("keeps a table-last document unchanged on load", () => {
    // Arrange — editor created in beforeEach with table-only doc

    // Assert
    expect(editor.state.doc.lastChild?.type.name).toBe("table")
  })

  it("adds a paragraph after a click below the table", async () => {
    // Arrange — editor created in beforeEach with table-only doc

    // Act
    mousedownBelowTable(editor)

    const { doc, selection } = editor.state
    expect(doc.childCount).toBe(2)
    expect(doc.child(0).type.name).toBe("table")
    expect(doc.child(1).type.name).toBe("paragraph")
    expect(doc.child(1).textContent).toBe("")
    const trailingParagraphStart = doc.content.size - doc.child(1).nodeSize
    expect(selection.from).toBeGreaterThanOrEqual(trailingParagraphStart)
    expect(selection.to).toBeLessThanOrEqual(doc.content.size)

    await userEvent.keyboard("typed below")

    // Assert
    const updatedDoc = editor.state.doc
    expect(updatedDoc.child(0).textContent).toBe("Cell")
    expect(updatedDoc.lastChild?.textContent).toBe("typed below")
  })

  it("ignores mousedown below the last block but outside the editor column", () => {
    // Arrange
    const dom = editor.view.dom
    const rect = dom.getBoundingClientRect()
    const contentEndBottom = editor.view.coordsAtPos(
      editor.state.doc.content.size - 1,
    ).bottom

    const event = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: rect.right + 20,
      clientY: contentEndBottom + 40,
      button: 0,
    })

    // Act
    const mousedown =
      ensureTrailingParagraphAfterTablePlugin.props.handleDOMEvents?.mousedown
    const handled = mousedown?.call(
      ensureTrailingParagraphAfterTablePlugin,
      editor.view,
      event,
    )

    // Assert
    expect(handled).toBe(false)
    expect(editor.state.doc.lastChild?.type.name).toBe("table")
  })
})
