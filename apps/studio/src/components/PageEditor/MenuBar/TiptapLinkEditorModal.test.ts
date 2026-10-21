import type { JSONContent } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  BASE_EXTENSIONS,
  PROSE_EXTENSIONS,
} from "~/features/editing-experience/hooks/useTextEditor/constants"

import { getLinkText } from "./TiptapLinkEditorModal"

// Paragraph with plain text immediately followed by a linked run, mirroring
// "...and <a>Pawnbrokers Rules 2015</a>" from ISOM-2731.
const LINK_TEXT = "Pawnbrokers Rules 2015"
const DOC: JSONContent = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Refer to the " },
        {
          type: "text",
          text: LINK_TEXT,
          marks: [{ type: "link", attrs: { href: "https://example.gov.sg" } }],
        },
      ],
    },
  ],
}

const createEditor = () =>
  new Editor({
    extensions: [...BASE_EXTENSIONS, ...PROSE_EXTENSIONS],
    content: DOC,
  })

const findLinkRange = (editor: Editor) => {
  let from = 0
  let to = 0
  editor.state.doc.descendants((node, pos) => {
    if (node.marks.some((mark) => mark.type.name === "link")) {
      from = pos
      to = pos + node.nodeSize
    }
  })
  return { from, to }
}

describe("getLinkText", () => {
  let editor: Editor

  afterEach(() => editor.destroy())

  it("returns the link's own text when only part of the link is highlighted", () => {
    editor = createEditor()
    const { from } = findLinkRange(editor)

    // Partial highlight starting at the link boundary: select "Pawnbrokers".
    editor.commands.setTextSelection({ from, to: from + "Pawnbrokers".length })

    expect(getLinkText(editor)).toBe(LINK_TEXT)
  })
})
