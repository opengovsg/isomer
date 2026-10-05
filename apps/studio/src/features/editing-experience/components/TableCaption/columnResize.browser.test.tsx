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
}: {
  onEditorReady: (editor: TiptapEditor) => void
}) => {
  const [data, setData] = useState<JSONContent | undefined>(content)
  const editor = useTextEditor({ data, handleChange: setData })
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

describe("column resize", () => {
  it("commits one undoable width list when a boundary is dragged", async () => {
    // Arrange
    let editor: TiptapEditor | undefined
    render(
      <ThemeProvider theme={theme}>
        <Harness
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
      fireEvent.pointerDown(handle, {
        clientX: x,
        clientY: y,
        button: 0,
        pointerType: "mouse",
      })
      fireEvent.pointerMove(handle, {
        clientX: x + 120,
        clientY: y,
        pointerType: "mouse",
      })
      fireEvent.pointerUp(handle, {
        clientX: x + 120,
        clientY: y,
        pointerType: "mouse",
      })
    })

    // Assert
    await waitFor(() => {
      const widths = editor ? widthsOf(editor) : null
      expect(widths).toHaveLength(2)
      expect(widths?.[0]).toBeGreaterThan(60)
      expect(widths?.[0]).toBeGreaterThanOrEqual(60)
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
})
