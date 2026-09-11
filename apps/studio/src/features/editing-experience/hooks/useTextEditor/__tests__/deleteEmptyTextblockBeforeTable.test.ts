import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  BASE_EXTENSIONS,
  HEADING_TYPE,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  PROSE_EXTENSIONS,
  TableRow,
} from "../constants"
import { deleteEmptyTextblockBeforeTable } from "../deleteEmptyTextblockBeforeTable"

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

const EMPTY_PARAGRAPH_BEFORE_TABLE_DOC: JSONContent = {
  type: "prose",
  content: [{ type: "paragraph", attrs: { dir: null } }, TABLE_BLOCK],
}

const createEditor = (
  content: JSONContent = EMPTY_PARAGRAPH_BEFORE_TABLE_DOC,
) =>
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

describe("deleteEmptyTextblockBeforeTable", () => {
  let editor: Editor

  beforeEach(() => {
    editor = createEditor()
    editor.commands.setTextSelection(1)
  })

  afterEach(() => {
    editor.destroy()
  })

  it("removes an empty paragraph before a table", () => {
    // Act
    const handled = deleteEmptyTextblockBeforeTable(editor)

    // Assert
    expect(handled).toBe(true)
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual([
      "table",
    ])
  })

  it("does not remove a paragraph that still has text", () => {
    // Arrange
    editor.destroy()
    editor = createEditor({
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "keep me" }],
        },
        TABLE_BLOCK,
      ],
    })
    editor.commands.setTextSelection(1)

    // Act
    const handled = deleteEmptyTextblockBeforeTable(editor)

    // Assert
    expect(handled).toBe(false)
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual([
      "paragraph",
      "table",
    ])
  })

  it("does not remove an empty paragraph when the next block is not a table", () => {
    // Arrange
    editor.destroy()
    editor = createEditor({
      type: "prose",
      content: [
        { type: "paragraph", attrs: { dir: null } },
        {
          type: "paragraph",
          content: [{ type: "text", text: "after" }],
        },
      ],
    })
    editor.commands.setTextSelection(1)

    // Act
    const handled = deleteEmptyTextblockBeforeTable(editor)

    // Assert
    expect(handled).toBe(false)
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual([
      "paragraph",
      "paragraph",
    ])
  })
})
