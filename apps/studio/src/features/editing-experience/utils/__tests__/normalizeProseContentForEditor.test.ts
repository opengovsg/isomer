import { describe, expect, it } from "vitest"

import { normalizeProseContentForEditor } from "../normalizeProseContentForEditor"

describe("normalizeProseContentForEditor", () => {
  it("should insert an empty paragraph when prose content is empty", () => {
    const content = { type: "prose", content: [] }

    expect(normalizeProseContentForEditor(content)).toEqual({
      type: "prose",
      content: [
        {
          type: "paragraph",
        },
      ],
    })
  })

  it("should leave valid prose content unchanged", () => {
    const content = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    }

    expect(normalizeProseContentForEditor(content)).toBe(content)
  })

  it("should leave non-prose data unchanged", () => {
    const content = { type: "callout", content: {} }

    expect(normalizeProseContentForEditor(content)).toBe(content)
  })
})
