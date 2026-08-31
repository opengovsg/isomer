// @vitest-environment jsdom

import type { JSONContent } from "@tiptap/react"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useEditorMock = vi.fn()

vi.mock("@tiptap/react", async (importActual) => {
  const actual = (await importActual()) as Record<string, unknown>
  return {
    ...actual,
    useEditor: (...args: unknown[]) => useEditorMock(...args),
  }
})

import { useTextEditor } from "../useTextEditor"

describe("useTextEditor", () => {
  beforeEach(() => {
    useEditorMock.mockReturnValue({})
  })

  it("passes enableContentCheck and onContentError to useEditor", () => {
    // Arrange
    const handleChange = vi.fn()
    const onContentError = vi.fn()
    const data: JSONContent = {
      type: "prose",
      content: [{ type: "paragraph" }],
    }

    // Act
    renderHook(() => useTextEditor({ data, handleChange, onContentError }))

    // Assert
    expect(useEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enableContentCheck: true,
        onContentError,
        content: data,
      }),
    )
  })
})
