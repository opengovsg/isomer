import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { JSONContent } from "@tiptap/react"
import { schema } from "@opengovsg/isomer-components"
import { TableRow } from "@tiptap/extension-table-row"
import { Editor } from "@tiptap/react"
import { afterEach, describe, expect, it } from "vitest"
import { ajv } from "~/utils/ajv"

import {
  BASE_EXTENSIONS,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
} from "../constants"

const pageSchemaValidator = ajv.compile<IsomerSchema>(schema)

const sizedTable = (widths: number[], labels: string[]): JSONContent => ({
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Sized", columnWidths: widths },
      content: [
        {
          type: "tableRow",
          content: labels.map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
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

const pageFor = (prose: JSONContent): IsomerSchema =>
  ({
    version: "0.1.0",
    layout: "content",
    page: {
      contentPageHeader: {
        summary: "Pasted table",
        showThumbnail: false,
      },
    },
    content: [prose],
  }) as IsomerSchema

const expectSaveable = (prose: JSONContent) => {
  const valid = pageSchemaValidator(pageFor(prose))
  expect(valid, JSON.stringify(pageSchemaValidator.errors)).toBe(true)
}

describe("pasted table column widths", () => {
  let editors: Editor[] = []

  afterEach(() => {
    for (const editor of editors) editor.destroy()
    editors = []
    document.body.replaceChildren()
  })

  it("keeps a pasted multi-column table saveable when widths are dropped", () => {
    // Arrange
    const source = createEditor(sizedTable([120, 280], ["Alpha", "Beta"]))
    editors.push(source)
    expectSaveable(source.getJSON())
    const html = source.getHTML()
    const pasted = createEditor({
      type: "prose",
      content: [{ type: "paragraph" }],
    })
    editors.push(pasted)

    // Act
    pasted.commands.setContent(html)

    // Assert
    expect(pasted.getText()).toContain("Alpha")
    expect(pasted.getText()).toContain("Beta")
    expectSaveable(pasted.getJSON())
  })

  it("keeps a pasted single-column table saveable when widths are dropped", () => {
    // Arrange
    const source = createEditor(sizedTable([120], ["Only"]))
    editors.push(source)
    expectSaveable(source.getJSON())
    const html = source.getHTML()
    const pasted = createEditor({
      type: "prose",
      content: [{ type: "paragraph" }],
    })
    editors.push(pasted)

    // Act
    pasted.commands.setContent(html)

    // Assert
    expect(pasted.getText()).toContain("Only")
    expectSaveable(pasted.getJSON())
  })
})
