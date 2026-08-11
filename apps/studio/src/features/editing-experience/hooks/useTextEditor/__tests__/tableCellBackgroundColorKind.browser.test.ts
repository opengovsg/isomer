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
    document.documentElement.style.removeProperty(
      "--color-brand-canvas-inverse",
    )
  })

  it("clears backgroundColor when a cell changes between header and body", () => {
    editor = createEditor(
      tableDoc({
        headerColor: "brand.canvas.inverse",
        bodyColor: "blue",
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
                { type: "tableCell", attrs: { backgroundColor: "blue" } },
              ],
            },
          ],
        },
      ],
    })
  })

  it("emits Brand data attribute on headers only", () => {
    editor = createEditor(
      tableDoc({
        headerColor: "brand.canvas.inverse",
        bodyColor: "brand.canvas.inverse",
      }),
    )
    const html = editor.getHTML()

    expect(html).toMatch(
      /<th\b[^>]*data-background-color="brand\.canvas\.inverse"/,
    )
    expect(html).not.toMatch(
      /<td\b[^>]*data-background-color="brand\.canvas\.inverse"/,
    )
  })

  it("emits palette data attribute on body cells only", () => {
    editor = createEditor(
      tableDoc({
        headerColor: "blue",
        bodyColor: "blue",
      }),
    )
    const html = editor.getHTML()

    expect(html).toMatch(/<td\b[^>]*data-background-color="blue"/)
    expect(html).not.toMatch(/<th\b[^>]*data-background-color="blue"/)
  })

  it("emits brand background and light text inline on header cells", () => {
    document.documentElement.style.setProperty(
      "--color-brand-canvas-inverse",
      "#123456",
    )

    editor = createEditor(
      tableDoc({
        headerColor: "brand.canvas.inverse",
        bodyColor: null,
      }),
    )

    const th = editor.view.dom.querySelector("th")!
    expect(th.getAttribute("data-background-color")).toBe(
      "brand.canvas.inverse",
    )
    expect(th.getAttribute("style")).toContain(
      "background-color: var(--color-brand-canvas-inverse)",
    )
    expect(th.getAttribute("style")).toContain("color: rgb(255, 255, 255)") // its #ffffff but the browser normalizes it to rgb(255, 255, 255)
    expect(getComputedStyle(th).color).toBe("rgb(255, 255, 255)")
  })

  it("does not emit brand styles on body cells", () => {
    document.documentElement.style.setProperty(
      "--color-brand-canvas-inverse",
      "#123456",
    )

    editor = createEditor(
      tableDoc({
        headerColor: null,
        bodyColor: "brand.canvas.inverse",
      }),
    )

    const td = editor.view.dom.querySelector("td")!
    expect(td.getAttribute("data-background-color")).toBeNull()
    expect(td.getAttribute("style")).toBeNull()
  })
})
