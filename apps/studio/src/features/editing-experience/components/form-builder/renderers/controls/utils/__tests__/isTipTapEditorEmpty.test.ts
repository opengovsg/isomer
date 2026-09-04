import { describe, expect, it } from 'vitest';
import { isTiptapEditorEmpty } from "../isTipTapEditorEmpty"

describe(isTiptapEditorEmpty, () => {

  it("should return true if the editor is empty", () => {
    expect(isTiptapEditorEmpty({ type: "prose", content: [] })).toBeTruthy()
  })

  it("should return true if the editor has empty paragraph", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "paragraph" }],
      }),
    ).toBeTruthy()
  })

  it("should return true if the editor has empty heading", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "heading", attrs: { level: 2 } }],
      }),
    ).toBeTruthy()
  })

  it("should return true if the editor is undefined", () => {
    expect(isTiptapEditorEmpty(undefined)).toBeTruthy()
  })

  it("should return false if the editor has paragraph with empty text", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
      }),
    ).toBeFalsy()
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
    ).toBeFalsy()
  })

  it("should return false if the editor has non-text content", () => {
    expect(
      isTiptapEditorEmpty({
        type: "prose",
        content: [{ type: "divider" }],
      }),
    ).toBeFalsy()
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
    ).toBeFalsy()
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
    ).toBeFalsy()
  })

  it("should return false if editor type is not prose", () => {
    expect(
      isTiptapEditorEmpty({
        type: "paragraph",
        content: [],
      }),
    ).toBeFalsy()
  })
})
