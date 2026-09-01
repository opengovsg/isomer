// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom — see
// the `*.browser.test.{ts,tsx}` convention in apps/studio/vitest.config.ts.
import type { Editor, JSONContent } from "@tiptap/react"
import { act, fireEvent, render, waitFor } from "@testing-library/react"
import { CellSelection } from "@tiptap/pm/tables"
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

const nthCellPos = (editor: Editor, index: number): number => {
  let seen = 0
  let found: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found !== null) return false
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      if (seen === index) {
        found = pos
        return false
      }
      seen += 1
    }
    return true
  })
  if (found === null) throw new Error(`Could not find cell at index ${index}`)
  return found
}

const selectCells = (editor: Editor, startIndex: number, endIndex: number) => {
  const anchorCell = nthCellPos(editor, startIndex)
  const headCell = nthCellPos(editor, endIndex)
  act(() => {
    editor.chain().focus().setCellSelection({ anchorCell, headCell }).run()
  })
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

// Retry hover until layout measurement has produced real row/column rects.
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
  it("reveals a passive row handle when hovering a data row", async () => {
    const { editor, container, queryByLabelText, getByLabelText } =
      await renderHarness()

    expect(queryByLabelText("Drag to reorder row")).toBeNull()

    const cell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(cell)
    const handle = await hoverUntil(x, y, () =>
      getByLabelText("Drag to reorder row"),
    )
    expect(handle.getAttribute("data-state")).toBe("passive")

    expect(getCellText(editor)[3]).toBe("Row 1, A")
  })

  it("promotes a row handle to hover when the pointer enters the handle", async () => {
    const { container, getByLabelText } = await renderHarness()

    const cell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(cell)
    const handle = await hoverUntil(x, y, () =>
      getByLabelText("Drag to reorder row"),
    )

    act(() => {
      fireEvent.mouseEnter(handle)
    })
    expect(handle.getAttribute("data-state")).toBe("hover")
  })

  it("reveals a row handle when hovering the header row", async () => {
    const { container, getByLabelText } = await renderHarness()

    const headerCell = findByCellText(container, "Column A")
    const { x, y } = centreOf(headerCell)
    await hoverUntil(x, y, () => getByLabelText("Drag to reorder row"))
  })

  it("reveals a column handle when hovering a column header", async () => {
    const { container, getByLabelText } = await renderHarness()

    const headerCell = findByCellText(container, "Column B")
    const { x, y } = centreOf(headerCell)
    await hoverUntil(x, y - 20, () => getByLabelText("Drag to reorder column"))
  })

  it("reveals a row handle when hovering a data row of a second table", async () => {
    const twoTables: JSONContent = {
      type: "prose",
      content: [
        SEED_CONTENT.content![0]!,
        {
          type: "table",
          attrs: { caption: "Second table" },
          content: [
            {
              type: "tableRow",
              content: ["X", "Y"].map((text) => ({
                type: "tableHeader",
                content: [
                  { type: "paragraph", content: [{ type: "text", text }] },
                ],
              })),
            },
            {
              type: "tableRow",
              content: ["Second-1-A", "Second-1-B"].map((text) => ({
                type: "tableCell",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text }],
                  },
                ],
              })),
            },
          ],
        },
      ],
    }

    let editor: Editor | undefined
    const TwoTableHarness = () => {
      const tipTap = useTextEditor({
        data: twoTables,
        handleChange: () => null,
      })
      const containerRef = useRef<HTMLDivElement>(null)
      if (tipTap) editor = tipTap
      return (
        <div ref={containerRef} style={{ position: "relative" }}>
          {tipTap && (
            <TableDragHandles editor={tipTap} containerRef={containerRef} />
          )}
          {tipTap && <EditorContent editor={tipTap} />}
        </div>
      )
    }

    const { container, getByLabelText, queryByLabelText } = render(
      <TwoTableHarness />,
    )
    await waitFor(() => {
      if (!editor) throw new Error("editor not ready")
    })

    expect(queryByLabelText("Drag to reorder row")).toBeNull()

    const cell = findByCellText(container, "Second-1-A")
    const { x, y } = centreOf(cell)
    await hoverUntil(x, y, () => getByLabelText("Drag to reorder row"))
  })

  it("clicking a row handle selects the entire row and becomes selected", async () => {
    const { editor, container, getByLabelText } = await renderHarness()

    const firstBodyCell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(firstBodyCell)
    const handle = await hoverUntil(x, y, () =>
      getByLabelText("Drag to reorder row"),
    )
    act(() => {
      fireEvent.mouseEnter(handle)
    })
    expect(handle.getAttribute("data-state")).toBe("hover")

    const handleCentre = centreOf(handle)

    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
      fireEvent.mouseUp(document, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
    })

    const selection = editor.state.selection
    expect(selection).toBeInstanceOf(CellSelection)
    expect((selection as CellSelection).isRowSelection()).toBe(true)
    expect((selection as CellSelection).isColSelection()).toBe(false)

    const selectedTexts: string[] = []
    ;(selection as CellSelection).forEachCell((node) => {
      selectedTexts.push(node.textContent)
    })
    expect(selectedTexts).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    expect(getCellText(editor).slice(3, 6)).toEqual([
      "Row 1, A",
      "Row 1, B",
      "Row 1, C",
    ])

    await waitFor(() => {
      expect(
        getByLabelText("Drag to reorder row").getAttribute("data-state"),
      ).toBe("selected")
    })
  })

  it("clicking a column handle selects the entire column and becomes selected", async () => {
    const { editor, container, getByLabelText } = await renderHarness()

    const headerCell = findByCellText(container, "Column B")
    const { x, y } = centreOf(headerCell)
    const handle = await hoverUntil(x, y - 20, () =>
      getByLabelText("Drag to reorder column"),
    )
    act(() => {
      fireEvent.mouseEnter(handle)
    })
    expect(handle.getAttribute("data-state")).toBe("hover")

    const handleCentre = centreOf(handle)

    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
      fireEvent.mouseUp(document, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
    })

    const selection = editor.state.selection
    expect(selection).toBeInstanceOf(CellSelection)
    expect((selection as CellSelection).isColSelection()).toBe(true)
    expect((selection as CellSelection).isRowSelection()).toBe(false)

    const selectedTexts: string[] = []
    ;(selection as CellSelection).forEachCell((node) => {
      selectedTexts.push(node.textContent)
    })
    expect(selectedTexts).toEqual([
      "Column B",
      "Row 1, B",
      "Row 2, B",
      "Row 3, B",
    ])
    expect(getCellText(editor).slice(0, 3)).toEqual([
      "Column A",
      "Column B",
      "Column C",
    ])

    await waitFor(() => {
      expect(
        getByLabelText("Drag to reorder column").getAttribute("data-state"),
      ).toBe("selected")
    })
  })

  it("keeps handles passive when multiple rows are selected", async () => {
    // Arrange
    const { editor, findAllByLabelText } = await renderHarness()

    // Act
    selectCells(editor, 3, 8)

    // Assert
    const handles = await findAllByLabelText("Drag to reorder row")
    expect(handles).toHaveLength(2)
    expect(handles.every((handle) => handle.dataset.state === "passive")).toBe(
      true,
    )
  })

  it("keeps handles passive when multiple columns are selected", async () => {
    // Arrange
    const { editor, findAllByLabelText } = await renderHarness()

    // Act
    selectCells(editor, 0, 10)

    // Assert
    const handles = await findAllByLabelText("Drag to reorder column")
    expect(handles).toHaveLength(2)
    expect(handles.every((handle) => handle.dataset.state === "passive")).toBe(
      true,
    )
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

  it("keeps add pills visible when the pointer moves into the gap below the table", async () => {
    // Arrange
    const { container, getByLabelText } = await renderHarness()
    const cell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(cell)
    await hoverUntil(x, y, () => getByLabelText("Add row below"))
    const table = container.querySelector("table")
    if (!table) throw new Error("table not found")
    const tableRect = table.getBoundingClientRect()

    // Act
    hoverAt(tableRect.left + tableRect.width / 2, tableRect.bottom + 4)

    // Assert
    expect(getByLabelText("Add row below")).toBeTruthy()
    expect(getByLabelText("Add column to the right")).toBeTruthy()
  })

  it("adds a row when the add-row pill is clicked after crossing the gap", async () => {
    // Arrange
    const { editor, container, getByLabelText } = await renderHarness()
    expect(getCellText(editor)).toHaveLength(12)
    const cell = findByCellText(container, "Row 3, A")
    const { x, y } = centreOf(cell)
    const addRow = await hoverUntil(x, y, () => getByLabelText("Add row below"))
    const pillCentre = centreOf(addRow)

    // Act
    hoverAt(pillCentre.x, pillCentre.y)
    act(() => {
      fireEvent.click(getByLabelText("Add row below"))
    })

    // Assert
    await waitFor(() => {
      expect(getCellText(editor)).toHaveLength(15)
    })
  })

  it("keeps the add-column pill inside an overflow-hidden editor", async () => {
    // Arrange
    let editor: Editor | undefined
    const ClipHarness = () => {
      const tipTap = useTextEditor({
        data: SEED_CONTENT,
        handleChange: () => null,
      })
      const containerRef = useRef<HTMLDivElement>(null)
      if (tipTap) editor = tipTap
      return (
        <div
          data-testid="clip-root"
          ref={containerRef}
          style={{ position: "relative", overflowX: "hidden", width: 420 }}
        >
          {tipTap && (
            <TableDragHandles editor={tipTap} containerRef={containerRef} />
          )}
          {tipTap && <EditorContent editor={tipTap} />}
        </div>
      )
    }
    const { getByLabelText, getByTestId } = render(<ClipHarness />)
    await waitFor(() => {
      if (!editor) throw new Error("editor not ready")
    })
    const clipRoot = getByTestId("clip-root")
    const cell = findByCellText(clipRoot, "Row 1, C")
    const { x, y } = centreOf(cell)
    const pill = await hoverUntil(x, y, () =>
      getByLabelText("Add column to the right"),
    )

    // Act
    const pillRect = pill.getBoundingClientRect()
    const clipRect = clipRoot.getBoundingClientRect()

    // Assert
    expect(pillRect.right).toBeLessThanOrEqual(clipRect.right + 0.5)
    expect(pillRect.left).toBeGreaterThanOrEqual(clipRect.left)
  })

  it("renders a rectangular row handle rather than a circle", async () => {
    // Arrange
    const { container, getByLabelText } = await renderHarness()
    const cell = findByCellText(container, "Row 1, A")
    const { x, y } = centreOf(cell)

    // Act
    const handle = await hoverUntil(x, y, () =>
      getByLabelText("Drag to reorder row"),
    )

    // Assert
    const { width, height } = handle.getBoundingClientRect()
    expect(height).toBeGreaterThan(width)
    const radius = parseFloat(getComputedStyle(handle).borderTopLeftRadius)
    expect(radius).toBeLessThan(Math.min(width, height) / 2)
  })

  it("renders a rectangular column handle rather than a circle", async () => {
    // Arrange
    const { container, getByLabelText } = await renderHarness()
    const headerCell = findByCellText(container, "Column B")
    const { x, y } = centreOf(headerCell)

    // Act
    const handle = await hoverUntil(x, y - 20, () =>
      getByLabelText("Drag to reorder column"),
    )

    // Assert
    const { width, height } = handle.getBoundingClientRect()
    expect(width).toBeGreaterThan(height)
    const radius = parseFloat(getComputedStyle(handle).borderTopLeftRadius)
    expect(radius).toBeLessThan(Math.min(width, height) / 2)
  })
})
