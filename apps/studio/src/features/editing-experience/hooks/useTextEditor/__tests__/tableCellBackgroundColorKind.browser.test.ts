import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { afterEach, describe, expect, it } from "vitest"

import {
  BASE_EXTENSIONS,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
  TableRow,
} from "../constants"

const tableDoc = ({
  headerColor,
  bodyColor,
}: {
  headerColor: string | null
  bodyColor: string | null
}): JSONContent => ({
  type: "prose",
  content: [
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              attrs: { backgroundColor: headerColor },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "H" }],
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
              attrs: { backgroundColor: bodyColor },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "B" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const createEditor = (content: JSONContent) => {
  const element = document.createElement("div")
  document.body.append(element)

  return new Editor({
    element,
    extensions: [
      ...BASE_EXTENSIONS,
      ...PROSE_EXTENSIONS,
      IsomerTable,
      TableRow,
      IsomerTableHeader,
      IsomerTableCell,
    ],
    content,
  })
}

describe("TipTap table cell backgroundColor", () => {
  let editor: Editor | undefined

  afterEach(() => {
    editor?.destroy()
    editor = undefined
    document.body.replaceChildren()
  })

  it("clears backgroundColor when a cell changes between header and body", () => {
    editor = createEditor(
      tableDoc({
        headerColor: "blue",
        bodyColor: "pink",
      }),
    )

    editor.chain().focus().toggleHeaderRow().run()

    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableCell", attrs: { backgroundColor: null } },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", attrs: { backgroundColor: "pink" } },
              ],
            },
          ],
        },
      ],
    })
  })

  it("emits palette data attributes on header and body cells", () => {
    editor = createEditor(
      tableDoc({
        headerColor: "blue",
        bodyColor: "pink",
      }),
    )
    const html = editor.getHTML()

    expect(html).toMatch(/<th\b[^>]*data-background-color="blue"/)
    expect(html).toMatch(/<td\b[^>]*data-background-color="pink"/)
  })

  it("emits inline background styles on header and body cells", () => {
    editor = createEditor(
      tableDoc({
        headerColor: "green",
        bodyColor: null,
      }),
    )

    const th = editor.view.dom.querySelector("th")!
    expect(th.getAttribute("data-background-color")).toBe("green")
    expect(th.getAttribute("style")).toContain("background-color:")
  })
})
