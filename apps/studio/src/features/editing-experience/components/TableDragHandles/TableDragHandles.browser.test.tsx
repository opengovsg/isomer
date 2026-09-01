// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom — see
// the `*.browser.test.{ts,tsx}` convention in apps/studio/vitest.config.ts.
import type { Editor, JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, fireEvent, render, waitFor } from "@testing-library/react"
import { CellSelection } from "@tiptap/pm/tables"
import { EditorContent } from "@tiptap/react"
import { useRef } from "react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { HANDLE_THICKNESS_PX } from "~/features/editing-experience/utils/tableEditorChrome"
import { theme } from "~/theme"

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
  const utils = render(
    <ThemeProvider theme={theme}>
      <Harness onReady={(e) => (editor = e)} />
    </ThemeProvider>,
  )
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

const queryHandle = (
  container: HTMLElement,
  axis: "row" | "column",
  index: number,
): HTMLElement | null =>
  container.querySelector(
    `[data-table-drag-handle="${axis}"][data-index="${index}"]`,
  )

const waitForHandle = async (
  container: HTMLElement,
  axis: "row" | "column",
  index: number,
): Promise<HTMLElement> =>
  waitFor(() => {
    const handle = queryHandle(container, axis, index)
    if (!handle) throw new Error(`${axis} handle ${index} not found`)
    return handle
  })

describe("TableDragHandles", () => {
  it("shows a handle for every row and column without hovering", async () => {
    // Arrange
    const { container } = await renderHarness()

    // Act
    const rowHandles = await waitFor(() => {
      const handles = container.querySelectorAll(
        '[data-table-drag-handle="row"]',
      )
      if (handles.length === 0) throw new Error("row handles not measured yet")
      return handles
    })
    const colHandles = container.querySelectorAll(
      '[data-table-drag-handle="column"]',
    )

    // Assert — seed table is 4 rows × 3 columns
    expect(rowHandles).toHaveLength(4)
    expect(colHandles).toHaveLength(3)
  })

  it("uses a white fill and unselected dots when a handle is idle", async () => {
    // Arrange / Act
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)

    // Assert
    expect(getComputedStyle(handle).backgroundColor).toBe("rgb(255, 255, 255)")
    const icon = handle.querySelector("svg")
    expect(icon && getComputedStyle(icon).color).toBe("rgb(160, 164, 173)")
  })

  it("uses medium dots when a handle is hovered", async () => {
    // Arrange
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)

    // Act
    act(() => {
      fireEvent.mouseEnter(handle)
    })

    // Assert
    await waitFor(() => {
      expect(getComputedStyle(handle).color).toBe("rgb(102, 108, 122)")
      const icon = handle.querySelector("svg")
      expect(icon && getComputedStyle(icon).color).toBe("rgb(102, 108, 122)")
    })
  })

  it("places the row handle outside the row", async () => {
    // Arrange
    const { container } = await renderHarness()
    const cell = findByCellText(container, "Row 1, A")
    const row = cell.closest("tr")
    if (!row) throw new Error("row not found")

    // Act
    const handle = await waitForHandle(container, "row", 1)

    // Assert
    expect(handle.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().left,
    )
  })

  it("places the column handle outside the column", async () => {
    // Arrange
    const { container } = await renderHarness()
    const headerCell = findByCellText(container, "Column B")

    // Act
    const handle = await waitForHandle(container, "column", 1)

    // Assert
    expect(handle.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      headerCell.getBoundingClientRect().top,
    )
  })

  it("shows a row handle for the header row so it can be selected", async () => {
    // Arrange / Act
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 0)

    // Assert
    expect(handle.getAttribute("aria-label")).toBe("Select row")
    expect(handle.tagName).toBe("BUTTON")
  })

  it("shows a column handle for every column including the first", async () => {
    // Arrange / Act
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "column", 1)

    // Assert
    expect(handle.getAttribute("aria-label")).toBe("Drag to reorder column")
  })

  it("shows handles for every row of a second table as well", async () => {
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

    // Arrange / Act
    const { container } = render(<TwoTableHarness />)
    await waitFor(() => {
      if (!editor) throw new Error("editor not ready")
    })
    const rowHandles = await waitFor(() => {
      const handles = container.querySelectorAll(
        '[data-table-drag-handle="row"]',
      )
      if (handles.length < 6) throw new Error("both tables not measured yet")
      return handles
    })
    const colHandles = container.querySelectorAll(
      '[data-table-drag-handle="column"]',
    )

    // Assert — 4×3 first table + 2×2 second table
    expect(rowHandles).toHaveLength(6)
    expect(colHandles).toHaveLength(5)
  })

  it("clicking a row handle selects the entire row and becomes selected", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)
    expect(handle.getAttribute("data-state")).toBe("passive")
    const handleCentre = centreOf(handle)

    // Act
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

    // Assert
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
      expect(queryHandle(container, "row", 1)?.getAttribute("data-state")).toBe(
        "selected",
      )
    })
  })

  it("clicking a column handle selects the entire column and becomes selected", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    const handle = await waitForHandle(container, "column", 1)
    expect(handle.getAttribute("data-state")).toBe("passive")
    const handleCentre = centreOf(handle)

    // Act
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

    // Assert
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
        queryHandle(container, "column", 1)?.getAttribute("data-state"),
      ).toBe("selected")
    })
  })

  it("selects a row when the handle is activated from the keyboard", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)

    // Act
    act(() => {
      handle.focus()
      fireEvent.click(handle)
    })

    // Assert
    const selection = editor.state.selection
    expect(selection).toBeInstanceOf(CellSelection)
    expect((selection as CellSelection).isRowSelection()).toBe(true)
  })

  it("keeps handles unselected when multiple rows are selected", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    await waitForHandle(container, "row", 1)

    // Act
    selectCells(editor, 3, 8)

    // Assert
    const handles = container.querySelectorAll('[data-table-drag-handle="row"]')
    expect(handles).toHaveLength(4)
    expect(
      [...handles].every(
        (handle) => handle.getAttribute("data-state") === "passive",
      ),
    ).toBe(true)
  })

  it("keeps handles unselected when multiple columns are selected", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    await waitForHandle(container, "column", 0)

    // Act
    selectCells(editor, 0, 10)

    // Assert
    const handles = container.querySelectorAll(
      '[data-table-drag-handle="column"]',
    )
    expect(handles).toHaveLength(3)
    expect(
      [...handles].every(
        (handle) => handle.getAttribute("data-state") === "passive",
      ),
    ).toBe(true)
  })

  it("drags a data row to a new position and reorders the document", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    expect(getCellText(editor).slice(3, 6)).toEqual([
      "Row 1, A",
      "Row 1, B",
      "Row 1, C",
    ])
    const handle = await waitForHandle(container, "row", 1)
    const handleCentre = centreOf(handle)

    // Act
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

    // Assert
    await waitFor(() => {
      const cells = getCellText(editor)
      expect(cells.slice(3, 6)).toEqual(["Row 2, A", "Row 2, B", "Row 2, C"])
      expect(cells.slice(6, 9)).toEqual(["Row 3, A", "Row 3, B", "Row 3, C"])
      expect(cells.slice(9, 12)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    })
  })

  it("does not reorder when dragging the header row, and click still selects it", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    const before = getCellText(editor)
    const handle = await waitForHandle(container, "row", 0)
    const handleCentre = centreOf(handle)
    const thirdBodyCell = findByCellText(container, "Row 3, A")
    const targetPos = centreOf(thirdBodyCell)

    // Act
    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
      fireEvent.mouseMove(document, {
        clientX: handleCentre.x,
        clientY: targetPos.y + 15,
      })
      fireEvent.mouseUp(document, {
        clientX: handleCentre.x,
        clientY: targetPos.y + 15,
      })
    })

    // Assert
    expect(getCellText(editor)).toEqual(before)
    expect(editor.state.selection).toBeInstanceOf(CellSelection)
    expect((editor.state.selection as CellSelection).isRowSelection()).toBe(
      true,
    )
  })

  it("does not drop a data row into the header row", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)
    const handleCentre = centreOf(handle)
    const headerCell = findByCellText(container, "Column A")
    const headerTop = headerCell.getBoundingClientRect().top

    // Act
    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
      fireEvent.mouseMove(document, {
        clientX: handleCentre.x,
        clientY: headerTop - 8,
      })
      fireEvent.mouseUp(document, {
        clientX: handleCentre.x,
        clientY: headerTop - 8,
      })
    })

    // Assert
    await waitFor(() => {
      expect(getCellText(editor).slice(0, 3)).toEqual([
        "Column A",
        "Column B",
        "Column C",
      ])
    })
  })

  it("drags a column to a new position and reorders the document", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    expect(getCellText(editor).slice(0, 3)).toEqual([
      "Column A",
      "Column B",
      "Column C",
    ])
    const handle = await waitForHandle(container, "column", 0)
    const handleCentre = centreOf(handle)

    // Act
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
        clientX: handleCentre.x + 10,
        clientY: handleCentre.y,
      })
      fireEvent.mouseMove(document, {
        clientX: targetPos.x + 40,
        clientY: handleCentre.y,
      })
    })
    act(() => {
      fireEvent.mouseUp(document, {
        clientX: targetPos.x + 40,
        clientY: handleCentre.y,
      })
    })

    // Assert
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
    await waitFor(() => {
      expect(getByLabelText("Add row below")).toBeTruthy()
      expect(getByLabelText("Add column to the right")).toBeTruthy()
    })
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
    await waitFor(() => getByLabelText("Add row below"))
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

  it("renders a rectangular 20px-thick row handle with no border", async () => {
    // Arrange / Act
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)

    // Assert
    const { width, height } = handle.getBoundingClientRect()
    expect(width).toBe(HANDLE_THICKNESS_PX)
    expect(height).toBeGreaterThan(width)
    expect(getComputedStyle(handle).borderTopWidth).toBe("0px")
    const radius = parseFloat(getComputedStyle(handle).borderTopLeftRadius)
    expect(radius).toBeLessThan(Math.min(width, height) / 2)
  })

  it("renders a rectangular 20px-thick column handle with no border", async () => {
    // Arrange / Act
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "column", 1)

    // Assert
    const { width, height } = handle.getBoundingClientRect()
    expect(height).toBe(HANDLE_THICKNESS_PX)
    expect(width).toBeGreaterThan(height)
    expect(getComputedStyle(handle).borderTopWidth).toBe("0px")
    const radius = parseFloat(getComputedStyle(handle).borderTopLeftRadius)
    expect(radius).toBeLessThan(Math.min(width, height) / 2)
  })

  it("uses the active fill and white dots when a handle is selected", async () => {
    // Arrange
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "row", 1)
    const handleCentre = centreOf(handle)

    // Act
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

    // Assert
    await waitFor(() => {
      const selected = queryHandle(container, "row", 1)
      expect(selected?.getAttribute("data-state")).toBe("selected")
      expect(selected && getComputedStyle(selected).backgroundColor).toBe(
        "rgb(34, 53, 255)",
      )
      const icon = selected?.querySelector("svg")
      expect(icon && getComputedStyle(icon).color).toBe("rgb(255, 255, 255)")
    })
  })

  it("remeasures handle position when the table is resized", async () => {
    // Arrange
    const { container } = await renderHarness()
    const handle = await waitForHandle(container, "column", 1)
    const before = handle.getBoundingClientRect()

    // Act
    const table = container.querySelector("table")
    if (!table) throw new Error("table not found")
    act(() => {
      table.style.width = `${before.width + 160}px`
    })

    // Assert
    await waitFor(() => {
      const after = handle.getBoundingClientRect()
      expect(
        Math.abs(after.left - before.left) +
          Math.abs(after.width - before.width),
      ).toBeGreaterThan(1)
    })
  })

  it("updates drop targets when the table resizes during a drag", async () => {
    // Arrange
    const { editor, container } = await renderHarness()
    const handle = await waitForHandle(container, "column", 0)
    const handleCentre = centreOf(handle)
    act(() => {
      fireEvent.mouseDown(handle, {
        clientX: handleCentre.x,
        clientY: handleCentre.y,
      })
      fireEvent.mouseMove(document, {
        clientX: handleCentre.x + 8,
        clientY: handleCentre.y,
      })
    })
    const table = container.querySelector("table")
    if (!table) throw new Error("table not found")
    const thirdHandle = await waitForHandle(container, "column", 2)
    const before = thirdHandle.getBoundingClientRect()

    // Act
    act(() => {
      table.style.width = `${table.getBoundingClientRect().width + 160}px`
    })
    await waitFor(() => {
      const after = thirdHandle.getBoundingClientRect()
      expect(Math.abs(after.left - before.left)).toBeGreaterThan(1)
    })
    const columnC = findByCellText(container, "Column C")
    const targetPos = centreOf(columnC)
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: targetPos.x + 20,
        clientY: handleCentre.y,
      })
      fireEvent.mouseUp(document, {
        clientX: targetPos.x + 20,
        clientY: handleCentre.y,
      })
    })

    // Assert
    await waitFor(() => {
      expect(getCellText(editor).slice(0, 3)).toEqual([
        "Column B",
        "Column C",
        "Column A",
      ])
    })
  })
})
