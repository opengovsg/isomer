import type { Editor as TiptapEditor, JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useEffect, useRef, useState } from "react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import {
  bindColumnWidthPreviewRoot,
  setColumnWidthPreviewTarget,
} from "~/features/editing-experience/utils/previewColumnWidths"
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
  const previewRootRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<JSONContent | undefined>(content)
  const editor = useTextEditor({
    data,
    handleChange: (next) => {
      onChange?.()
      setData(next)
    },
  })
  useEffect(() => {
    setColumnWidthPreviewTarget(
      [{ type: "prose", content: [{ type: "table" }] }],
      1,
    )
    bindColumnWidthPreviewRoot(previewRootRef.current)
    return () => {
      bindColumnWidthPreviewRoot(null)
      setColumnWidthPreviewTarget([], 0)
    }
  }, [])
  if (editor) onEditorReady(editor)
  return (
    <>
      <div ref={previewRootRef}>
        <table data-preview-decoy>
          <tbody>
            <tr>
              <td>Earlier</td>
              <td>Block</td>
            </tr>
          </tbody>
        </table>
        <table data-preview-table>
          <tbody>
            <tr>
              <td>A</td>
              <td>B</td>
            </tr>
          </tbody>
        </table>
      </div>
      <EditorContent editor={editor} />
    </>
  )
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

const previewWidth = () => {
  const col = document.querySelector("[data-column-resize-root] col")
  return col instanceof HTMLElement ? Number.parseFloat(col.style.width) : 0
}

const paintedTable = (selector: string) => {
  const table = document.querySelector(selector)
  return table instanceof HTMLTableElement ? table : null
}

describe("column resize", () => {
  it("previews while dragging and commits one undoable width on release", async () => {
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
      expect(previewWidth()).toBeGreaterThan(60)
      expect(
        Number.parseFloat(
          paintedTable("[data-preview-table]")?.style.width ?? "",
        ),
      ).toBeGreaterThan(60)
    })
    expect(paintedTable("[data-preview-table]")?.style.tableLayout).toBe(
      "fixed",
    )
    expect(
      paintedTable("[data-preview-table]")?.querySelector("td")?.style.maxWidth,
    ).toBe("none")
    expect(paintedTable("[data-preview-decoy]")?.style.width).toBe("")
    expect(editor && widthsOf(editor)).toBeNull()
    expect(changes).toBe(changesBefore)

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
    expect(changes).toBe(changesBefore + 1)
    act(() => {
      editor?.commands.undo()
    })
    expect(editor && widthsOf(editor)).toBeNull()
    expect(editor?.getText()).toContain("A")
  })

  it("drops a cancelled drag without writing column widths", async () => {
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
      pointer(handle, "pointerMove", x + 120, y)
    })
    await waitFor(() => {
      expect(previewWidth()).toBeGreaterThan(60)
      expect(
        Number.parseFloat(
          paintedTable("[data-preview-table]")?.style.width ?? "",
        ),
      ).toBeGreaterThan(60)
    })
    act(() => {
      pointer(handle, "pointerCancel", x + 120, y)
    })

    // Assert
    await waitFor(() => {
      expect(previewWidth()).toBe(0)
      expect(paintedTable("[data-preview-table]")?.style.width).toBe("")
    })
    expect(paintedTable("[data-preview-table]")?.style.tableLayout).toBe("")
    expect(
      paintedTable("[data-preview-table]")?.querySelector("colgroup"),
    ).toBeNull()
    expect(
      paintedTable("[data-preview-table]")?.querySelector("td")?.style.maxWidth,
    ).toBe("")
    expect(paintedTable("[data-preview-decoy]")?.style.width).toBe("")
    expect(editor && widthsOf(editor)).toBeNull()
    expect(changes).toBe(changesBefore)
    act(() => {
      pointer(handle, "pointerUp", x + 120, y)
    })
    expect(editor && widthsOf(editor)).toBeNull()
  })
})
