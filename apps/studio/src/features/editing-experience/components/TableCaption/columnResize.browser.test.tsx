import type { Editor as TiptapEditor, JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"

const content: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Resize" },
      content: [
        {
          type: "tableRow",
          content: ["A", "B"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
      ],
    },
  ],
}

const Harness = ({
  onEditorReady,
  onChange,
}: {
  onEditorReady: (editor: TiptapEditor) => void
  onChange?: () => void
}) => {
  const [data, setData] = useState<JSONContent | undefined>(content)
  const editor = useTextEditor({
    data,
    handleChange: (next) => {
      onChange?.()
      setData(next)
    },
  })
  if (editor) onEditorReady(editor)
  return <EditorContent editor={editor} />
}

const widthsOf = (editor: TiptapEditor): number[] | null => {
  let widths: number[] | null = null
  editor.state.doc.descendants((node) => {
    if (node.type.name === "table") {
      widths = node.attrs.columnWidths as number[] | null
      return false
    }
    return true
  })
  return widths
}

const pointer = (
  handle: HTMLElement,
  type: "pointerDown" | "pointerMove" | "pointerUp" | "pointerCancel",
  clientX: number,
  clientY: number,
) => {
  fireEvent[type](handle, {
    clientX,
    clientY,
    button: 0,
    pointerId: 1,
    pointerType: "mouse",
  })
}

const editorColumnWidth = () => {
  const col = document.querySelector("[data-column-resize-root] col")
  return col instanceof HTMLElement ? Number.parseFloat(col.style.width) : 0
}

describe("column resize", () => {
  it("writes widths every frame while dragging and undoes the whole drag in one step", async () => {
    // Arrange
    let editor: TiptapEditor | undefined
    let changes = 0
    render(
      <ThemeProvider theme={theme}>
        <Harness
          onChange={() => {
            changes += 1
          }}
          onEditorReady={(next) => {
            editor = next
          }}
        />
      </ThemeProvider>,
    )
    const handle = await screen.findByRole("separator", {
      name: "Resize column 1",
    })
    const { x, y } = handle.getBoundingClientRect()
    const changesBefore = changes

    // Act
    act(() => {
      pointer(handle, "pointerDown", x, y)
      pointer(handle, "pointerMove", x + 80, y)
      pointer(handle, "pointerMove", x + 120, y)
    })

    await waitFor(() => {
      expect(editorColumnWidth()).toBeGreaterThan(60)
    })
    // Drag frames reach the doc so the page preview resizes live. Both moves
    // land in one frame, so they coalesce into a single update.
    expect(editor && widthsOf(editor)?.[0]).toBeGreaterThan(60)
    expect(changes).toBe(changesBefore + 1)

    act(() => {
      pointer(handle, "pointerUp", x + 120, y)
    })

    // Assert
    await waitFor(() => {
      const widths = editor ? widthsOf(editor) : null
      expect(widths).toHaveLength(2)
      expect(widths?.[0]).toBeGreaterThan(60)
      expect(widths?.[0]).toBeLessThanOrEqual(400)
      expect(widths?.[1]).toBeGreaterThanOrEqual(60)
      expect(widths?.[1]).toBeLessThanOrEqual(400)
    })
    act(() => {
      editor?.commands.undo()
    })
    expect(editor && widthsOf(editor)).toBeNull()
    expect(editor?.getText()).toContain("A")
  })

  it("restores the original widths when a drag is cancelled", async () => {
    // Arrange
    let editor: TiptapEditor | undefined
    let changes = 0
    render(
      <ThemeProvider theme={theme}>
        <Harness
          onChange={() => {
            changes += 1
          }}
          onEditorReady={(next) => {
            editor = next
          }}
        />
      </ThemeProvider>,
    )
    const handle = await screen.findByRole("separator", {
      name: "Resize column 1",
    })
    const { x, y } = handle.getBoundingClientRect()

    // Act
    act(() => {
      pointer(handle, "pointerDown", x, y)
      pointer(handle, "pointerMove", x + 120, y)
    })
    await waitFor(() => {
      expect(editorColumnWidth()).toBeGreaterThan(60)
    })
    act(() => {
      pointer(handle, "pointerCancel", x + 120, y)
    })

    // Assert
    await waitFor(() => {
      expect(editorColumnWidth()).toBe(0)
    })
    expect(editor && widthsOf(editor)).toBeNull()
    act(() => {
      pointer(handle, "pointerUp", x + 120, y)
    })
    expect(editor && widthsOf(editor)).toBeNull()
  })
})
