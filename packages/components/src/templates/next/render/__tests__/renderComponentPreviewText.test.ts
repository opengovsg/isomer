import { describe, expect, it } from "vitest"

import { renderComponentPreviewText } from "../renderComponentPreviewText"

describe("renderComponentPreviewText", () => {
  describe("canvas", () => {
    it("previews the first child with meaningful text", () => {
      const previewText = renderComponentPreviewText({
        component: {
          type: "canvas",
          blocks: [
            {
              type: "blockquote",
              quote: "A quote inside the canvas",
              source: "A source",
            },
            {
              type: "keystatistics",
              title: "Stats inside the canvas",
              statistics: [{ label: "A label", value: "42" }],
            },
          ],
        },
      })

      expect(previewText).toBe("A quote inside the canvas")
    })

    it("skips children without preview text", () => {
      const previewText = renderComponentPreviewText({
        component: {
          type: "canvas",
          blocks: [
            {
              type: "prose",
              content: [{ type: "paragraph", content: [] }],
            },
            {
              type: "callout",
              content: {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Callout text" }],
                  },
                ],
              },
            },
          ],
        },
      })

      expect(previewText).toBe("Callout text")
    })

    it("recurses through nested prose children", () => {
      const previewText = renderComponentPreviewText({
        component: {
          type: "canvas",
          blocks: [
            {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Plain text child" }],
                },
              ],
            },
          ],
        },
      })

      expect(previewText).toBe("Plain text child")
    })

    it("returns an empty string for an empty canvas so Studio shows the empty-block label", () => {
      const previewText = renderComponentPreviewText({
        component: {
          type: "canvas",
          blocks: [],
        },
      })

      expect(previewText).toBe("")
    })
  })
})
