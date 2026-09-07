import { isTiptapEditorEmpty } from "../isTipTapEditorEmpty"

describe("isTiptapEditorEmpty", () => {
  it("should return true if the editor is empty", () => {
    expect(isTiptapEditorEmpty({ content: [], type: "prose" })).toBe(true)
  })

  it("should return true if the editor has empty paragraph", () => {
    expect(
      isTiptapEditorEmpty({
        content: [{ type: "paragraph" }],
        type: "prose",
      }),
    ).toBe(true)
  })

  it("should return true if the editor has empty heading", () => {
    expect(
      isTiptapEditorEmpty({
        content: [{ type: "heading", attrs: { level: 2 } }],
        type: "prose",
      }),
    ).toBe(true)
  })

  it("should return true if the editor is undefined", () => {
    expect(isTiptapEditorEmpty()).toBe(true)
  })

  it("should return false if the editor has paragraph with empty text", () => {
    expect(
      isTiptapEditorEmpty({
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
        type: "prose",
      }),
    ).toBe(false)
  })

  it("should return false if the editor has multiple content blocks", () => {
    expect(
      isTiptapEditorEmpty({
        content: [
          { type: "paragraph", content: [{ type: "text", text: "test" }] },
          { type: "paragraph", content: [{ type: "text", text: "test2" }] },
        ],
        type: "prose",
      }),
    ).toBe(false)
  })

  it("should return false if the editor has non-text content", () => {
    expect(
      isTiptapEditorEmpty({
        content: [{ type: "divider" }],
        type: "prose",
      }),
    ).toBe(false)
  })

  it("should return false if the editor has non-empty paragraph", () => {
    expect(
      isTiptapEditorEmpty({
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "test" }],
          },
        ],
        type: "prose",
      }),
    ).toBe(false)
  })

  it("should return false if the editor has non-empty heading", () => {
    expect(
      isTiptapEditorEmpty({
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "test" }],
          },
        ],
        type: "prose",
      }),
    ).toBe(false)
  })

  it("should return false if editor type is not prose", () => {
    expect(
      isTiptapEditorEmpty({
        content: [],
        type: "paragraph",
      }),
    ).toBe(false)
  })
})
