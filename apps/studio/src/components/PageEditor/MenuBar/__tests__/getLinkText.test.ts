import { Schema } from "@tiptap/pm/model"
import { describe, expect, it } from "vitest"

import { getLinkTextFromSelection } from "../getLinkText"

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "text*", toDOM: () => ["p", 0] },
    text: { group: "inline" },
  },
  marks: {
    link: {
      attrs: { href: {} },
      toDOM: (mark) => ["a", { href: mark.attrs.href as string }, 0],
    },
  },
})

const SENTENCE = "Click here to learn more"

const buildLinkedDoc = () => {
  const linkMark = schema.marks.link.create({ href: "https://example.com" })
  const linkedText = schema.text(SENTENCE, [linkMark])
  return schema.node("doc", null, [
    schema.node("paragraph", null, [linkedText]),
  ])
}

describe("getLinkTextFromSelection", () => {
  const doc = buildLinkedDoc()
  // Paragraph text starts at doc position 1, so "here" spans [hereFrom, hereTo].
  const hereFrom = SENTENCE.indexOf("here") + 1
  const hereTo = hereFrom + "here".length

  it("returns only the highlighted word when a sub-range of a link is selected", () => {
    expect(
      getLinkTextFromSelection({
        isLinkActive: true,
        selection: { from: hereFrom, to: hereTo },
        doc,
      }),
    ).toBe("here")
  })

  it("returns the full link text when the cursor is inside a link without a selection", () => {
    expect(
      getLinkTextFromSelection({
        isLinkActive: true,
        selection: { from: hereFrom, to: hereFrom },
        doc,
      }),
    ).toBe(SENTENCE)
  })

  it("returns the selected text when not in a link", () => {
    const plainDoc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text(SENTENCE)]),
    ])
    expect(
      getLinkTextFromSelection({
        isLinkActive: false,
        selection: { from: 1, to: 6 },
        doc: plainDoc,
      }),
    ).toBe("Click")
  })
})
