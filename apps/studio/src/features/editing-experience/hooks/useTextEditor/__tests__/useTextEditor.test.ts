// @vitest-environment jsdom

import type { JSONContent } from "@tiptap/react"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useEditorMock = vi.fn((_options: unknown): object => ({}))

vi.mock("@tiptap/react", () => ({
  useEditor: (options: unknown): object => useEditorMock(options),
}))

import { normalizeProseContentForEditor } from "../../../utils/normalizeProseContentForEditor"
import { useTextEditor } from "../useTextEditor"

describe("useTextEditor", () => {
  beforeEach(() => {
    useEditorMock.mockClear()
  })

  it("passes enableContentCheck and onContentError to useEditor", () => {
    const handleChange = vi.fn()
    const onContentError = vi.fn()
    const data: JSONContent = {
      type: "prose",
      content: [{ type: "paragraph" }],
    }

    renderHook(() => useTextEditor({ data, handleChange, onContentError }))

    expect(useEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enableContentCheck: true,
        onContentError: expect.any(Function),
        content: data,
      }),
    )
  })

  it("normalizes empty prose content before passing it to useEditor", () => {
    const handleChange = vi.fn()
    const data: JSONContent = { type: "prose", content: [] }

    renderHook(() => useTextEditor({ data, handleChange }))

    expect(useEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: normalizeProseContentForEditor(data),
      }),
    )
  })
})
