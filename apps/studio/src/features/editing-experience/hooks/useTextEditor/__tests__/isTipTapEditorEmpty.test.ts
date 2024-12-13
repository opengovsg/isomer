import { isTiptapEditorEmpty } from "../isTipTapEditorEmpty"

describe("isTiptapEditorEmpty", () => {
  it("should return true if the editor is empty", () => {
    expect(isTiptapEditorEmpty({ type: "prose", content: [] })).toBe(true)
  })

  it("should return true if the editor has empty paragraph", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "paragraph" }],
      }),
    ).toBe(true)
  })

  it("should return true if the editor has empty heading", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "heading", attrs: { level: 2 } }],
      }),
    ).toBe(true)
  })

  it("should return false if the editor has paragraph with empty text", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
      }),
    ).toBe(false)
  })

  it("should return false if the editor has multiple content blocks", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "test" }] },
          { type: "paragraph", content: [{ type: "text", text: "test2" }] },
        ],
      }),
    ).toBe(false)
  })

  it("should return false if the editor has non-text content", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "divider" }],
      }),
    ).toBe(false)
  })

  it("should return false if the editor has non-empty paragraph", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "test" }],
          },
        ],
      }),
    ).toBe(false)
  })

  it("should return false if the editor has non-empty heading", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "test" }],
          },
        ],
      }),
    ).toBe(false)
  })

  it("should return false if editor type is not prose", () => {
    expect(
      isTiptapEditorEmpty({
        type: "paragraph",
        content: [],
      }),
    ).toBe(false)
  })
})
