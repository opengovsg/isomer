// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom — see
// the `*.browser.test.{ts,tsx}` convention in apps/studio/vitest.config.ts.
import type { Editor, JSONContent } from "@tiptap/react"
import { act, fireEvent, render, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useRef } from "react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

import { TableDragHandles } from "./TableDragHandles"

const SEED_CONTENT: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Test table" },
      content: [
        {
          type: "tableRow",
          content: ["Column A", "Column B", "Column C"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
        ...[1, 2, 3].map((row) => ({
          type: "tableRow",
          content: ["A", "B", "C"].map((col) => ({
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: `Row ${row}, ${col}` }],
              },
            ],
          })),
        })),
      ],
    },
  ],
}

const getCellText = (editor: Editor): string[] => {
  const texts: string[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      texts.push(node.textContent)
      return false
    }
    return true
  })
  return texts
}

const Harness = ({ onReady }: { onReady: (editor: Editor) => void }) => {
  const editor = useTextEditor({ data: SEED_CONTENT, handleChange: () => null })
  const containerRef = useRef<HTMLDivElement>(null)
  if (editor) onReady(editor)
  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {editor && (
        <TableDragHandles editor={editor} containerRef={containerRef} />
      )}
      {editor && <EditorContent editor={editor} />}
    </div>
  )
}

const renderHarness = async () => {
  let editor: Editor | undefined
  const utils = render(<Harness onReady={(e) => (editor = e)} />)
  await waitFor(() => {
    if (!editor) throw new Error("editor not ready")
  })
  return { ...utils, editor: editor! }
}

const findByCellText = (container: HTMLElement, text: string): HTMLElement => {
  const cells = container.querySelectorAll("td, th")
  for (const cell of cells) {
    if (cell.textContent === text) return cell as HTMLElement
  }
  throw new Error(`Could not find cell with text "${text}"`)
}

const centreOf = (el: Element) => {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

const hoverAt = (x: number, y: number) => {
  act(() => {
    fireEvent.mouseMove(document, { clientX: x, clientY: y })
  })
}

// A real cursor continuously emits mousemove events while it's stationary
// over an element (the browser still dispatches them on any movement, however
// tiny) — a single synthetic mousemove can race the component's own
// measurement pass (its rects may still be an all-zero placeholder on the
// very first layout tick, matching bug 1 documented in the prototype this
// component was ported from), so `waitFor` re-fires the same hover on every
// retry until a real rect has been measured and the handle mounts.
const hoverUntil = async (
  x: number,
  y: number,
  check: () => HTMLElement,
): Promise<HTMLElement> =>
  waitFor(() => {
    hoverAt(x, y)
    return check()
  })

describe("TableDragHandles", () => {
  it("reveals a row handle when hovering a data row", async () => {
    const { editor, container, queryByLabelText, getByLabelText } =
      await renderHarness()

    expect(queryByLabelText("Drag to reorder row")).toBeNull()

    const cell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(cell)
    await hoverUntil(x, y, () => getByLabelText("Drag to reorder row"))

    // Sanity: hovering alone doesn't mutate the document.
    expect(getCellText(editor)[3]).toBe("Row 1, A")
  })

  it("does not reveal a row handle when hovering the header row", async () => {
    const { container, queryByLabelText } = await renderHarness()

    const headerCell = findByCellText(container, "Column A")
    const { x, y } = centreOf(headerCell)
    hoverAt(x, y)
    // Give the (initially all-zero) rect measurement time to settle and any
    // (incorrect) handle a chance to mount before asserting its absence.
    await new Promise((resolve) => setTimeout(resolve, 100))
    hoverAt(x, y)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(queryByLabelText("Drag to reorder row")).toBeNull()
  })

  it("reveals a column handle when hovering a column header", async () => {
    const { container, getByLabelText } = await renderHarness()

    const headerCell = findByCellText(container, "Column B")
    const { x, y } = centreOf(headerCell)
    // The column handle renders above the header row; hover slightly above
    // the header cell (within the widened hover margin) the way a cursor
    // travelling from inside the table toward the handle would.
    await hoverUntil(x, y - 20, () => getByLabelText("Drag to reorder column"))
  })

  it("drags a data row to a new position and reorders the document", async () => {
    const { editor, container, getByLabelText } = await renderHarness()

    expect(getCellText(editor).slice(3, 6)).toEqual([
      "Row 1, A",
      "Row 1, B",
      "Row 1, C",
    ])

    const firstBodyCell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(firstBodyCell)
    const handle = await hoverUntil(x, y, () =>
      getByLabelText("Drag to reorder row"),
    )
    const handleCentre = centreOf(handle)

    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
    })

    const thirdBodyCell = findByCellText(container, "Row 3, A")
    const targetPos = centreOf(thirdBodyCell)

    act(() => {
      fireEvent.mouseMove(document, {
        clientX: handleCentre.x,
        clientY: targetPos.y + 15, // past row 3's midpoint -> drop after row 3
      })
    })
    act(() => {
      fireEvent.mouseUp(document, {
        clientX: handleCentre.x,
        clientY: targetPos.y + 15,
      })
    })

    await waitFor(() => {
      const cells = getCellText(editor)
      expect(cells.slice(3, 6)).toEqual(["Row 2, A", "Row 2, B", "Row 2, C"])
      expect(cells.slice(6, 9)).toEqual(["Row 3, A", "Row 3, B", "Row 3, C"])
      expect(cells.slice(9, 12)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    })
  })

  it("drags a column to a new position and reorders the document", async () => {
    const { editor, container, getByLabelText } = await renderHarness()

    expect(getCellText(editor).slice(0, 3)).toEqual([
      "Column A",
      "Column B",
      "Column C",
    ])

    const headerCell = findByCellText(container, "Column A")
    const { x, y } = centreOf(headerCell)
    const handle = await hoverUntil(x, y - 20, () =>
      getByLabelText("Drag to reorder column"),
    )
    const handleCentre = centreOf(handle)

    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
    })

    const columnCCell = findByCellText(container, "Column C")
    const targetPos = centreOf(columnCCell)

    act(() => {
      fireEvent.mouseMove(document, {
        clientX: targetPos.x + 20, // past column C's midpoint -> drop after it
        clientY: handleCentre.y,
      })
    })
    act(() => {
      fireEvent.mouseUp(document, {
        clientX: targetPos.x + 20,
        clientY: handleCentre.y,
      })
    })

    await waitFor(() => {
      expect(getCellText(editor).slice(0, 3)).toEqual([
        "Column B",
        "Column C",
        "Column A",
      ])
    })
  })
})
