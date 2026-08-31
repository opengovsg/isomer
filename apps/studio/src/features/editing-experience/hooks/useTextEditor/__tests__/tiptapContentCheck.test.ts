import { Editor } from "@tiptap/react"
import { describe, expect, it } from "vitest"

import { BASE_EXTENSIONS, TEXT_EDITOR_EXTRA_EXTENSIONS } from "../constants"

const proseEditorExtensions = [
  ...BASE_EXTENSIONS,
  ...TEXT_EDITOR_EXTRA_EXTENSIONS,
]

describe("TipTap enableContentCheck", () => {
  it("should not emit contentError for stylized unicode", () => {
    const content = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥" }],
        },
      ],
    }
    let contentError: Error | undefined

    const editor = new Editor({
      extensions: proseEditorExtensions,
      content,
      enableContentCheck: true,
      onContentError: ({ error }) => {
        contentError = error
      },
    })

    expect(contentError).toBeUndefined()
    editor.destroy()
  })

  it("should emit contentError for empty prose content", () => {
    const content = { type: "prose", content: [] }
    let contentError: Error | undefined

    const editor = new Editor({
      extensions: proseEditorExtensions,
      content,
      enableContentCheck: true,
      onContentError: ({ error }) => {
        contentError = error
      },
    })

    expect(contentError).toBeDefined()
    editor.destroy()
  })
})
