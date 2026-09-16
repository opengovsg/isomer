import type { ProseProps } from "@opengovsg/isomer-components"
import type { Editor, JSONContent } from "@tiptap/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { render, waitFor } from "@testing-library/react"
import { closeHistory, undoDepth } from "@tiptap/pm/history"
import { EditorContent } from "@tiptap/react"
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ajv } from "~/utils/ajv"

import { useTextEditor } from "../../hooks/useTextEditor/useTextEditor"
import { isTableColumnResizeDragging } from "../tableLayoutController"

// Same schema and validator as EditPageDrawer.tsx.
const validateProse = ajv.compile<ProseProps>(
  getComponentSchema({ component: "prose" }),
)

// useTextEditor imports ~/utils/trpc, which reads env.mjs at load time.
// Vitest Browser Mode has no process.env, so mock trpc even though this test never calls it.
vi.mock("~/utils/trpc", () => ({ trpc: {} }))

const TestEditor = ({ onReady }: { onReady: (editor: Editor) => void }) => {
  const editor = useTextEditor({ data: undefined, handleChange: () => null })
  if (editor) {
    onReady(editor)
  }
  return <EditorContent editor={editor} />
}

const renderEditor = async () => {
  let editor: Editor | null = null
  render(<TestEditor onReady={(e) => (editor = e)} />)
  await waitFor(() => expect(editor).not.toBeNull())
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return editor!
}

const getColWidths = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLTableColElement>("col")).map(
    (col) => parseFloat(col.style.width),
  )

const dispatchPointer = (
  target: EventTarget,
  type: string,
  clientX: number,
) => {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, clientX }),
  )
}

const getEditorTable = (editor: Editor) => {
  const table = editor.view.dom.querySelector("table")
  if (!table) {
    throw new Error("table not found")
  }
  return table
}

const resizeFirstColumn = async () => {
  await waitFor(() => {
    expect(
      document.querySelector(
        '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
      ),
    ).not.toBeNull()
  })
  const firstHandle = document.querySelector(
    '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
  )
  if (!firstHandle) {
    throw new Error("resize handle not found")
  }
  act(() => {
    dispatchPointer(firstHandle, "pointerdown", 100)
  })
  act(() => {
    dispatchPointer(window, "pointermove", 140)
  })
  act(() => {
    dispatchPointer(window, "pointerup", 140)
  })
}

describe("table column-width resize", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("produces a schema-valid document for a freshly inserted, unresized table", async () => {
    // Arrange
    const editor = await renderEditor()

    // Act
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    // Assert
    const json = editor.getJSON()
    const isValid = validateProse(json)
    expect(isValid, JSON.stringify(validateProse.errors)).toBe(true)
  })

  it("renders one resize handle per interior column boundary", async () => {
    // Arrange
    const editor = await renderEditor()

    // Act
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    // Assert
    await waitFor(() => {
      expect(
        document.querySelectorAll('[data-testid="isomer-table-resize-handle"]')
          .length,
      ).toBe(2) // 3 columns -> 2 interior boundaries
    })
  })

  it("only changes the dragged column and its direct neighbour during a live drag, and persists on release", async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, "error")
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    const table = await waitFor(() => {
      const element = document.querySelector("table")
      expect(element).not.toBeNull()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const found = element!
      expect(getColWidths(found)).toHaveLength(3)
      return found
    })
    const initialWidths = getColWidths(table)
    initialWidths.forEach((width) => {
      expect(width).toBeCloseTo(100 / 3, 3)
    })

    const firstHandle = document.querySelector(
      '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
    )
    expect(firstHandle).not.toBeNull()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const handle = firstHandle!

    // Act
    act(() => {
      dispatchPointer(handle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 140)
    })

    // Assert
    const duringDragWidths = getColWidths(table)
    expect(duringDragWidths[0]).toBeGreaterThan(initialWidths[0] ?? 0)
    expect(duringDragWidths[1]).toBeLessThan(initialWidths[1] ?? 0)
    expect(duringDragWidths[2]).toBeCloseTo(initialWidths[2] ?? 0, 3)
    expect(duringDragWidths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(
      100,
      5,
    )

    // Act
    act(() => {
      dispatchPointer(window, "pointerup", 140)
    })

    // Assert
    const json = editor.getJSON()
    const tableJson: JSONContent | undefined = json.content?.[0]
    const persistedWidths: number[] =
      (tableJson?.attrs?.colwidths as number[] | undefined) ?? []
    expect(persistedWidths).toHaveLength(3)
    expect(persistedWidths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(
      100,
      5,
    )
    persistedWidths.forEach((width, index) => {
      // CSS width strings have less precision than doc attrs.
      expect(width).toBeCloseTo(duringDragWidths[index] ?? 0, 2)
    })

    // Assert
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it("commits mid-drag widths into the document (not just the DOM) so a live preview can track the drag", async () => {
    // Arrange
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    const initialWidths: number[] =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    act(() => {
      editor.view.dispatch(closeHistory(editor.state.tr))
    })
    const depthBeforeDrag = undoDepth(editor.state)

    const firstHandle = await waitFor(() => {
      const handle = document.querySelector(
        '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
      )
      expect(handle).not.toBeNull()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return handle!
    })

    // Act
    act(() => {
      dispatchPointer(firstHandle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 140)
    })
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
    })

    // Assert
    const midDragWidths: number[] =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    expect(midDragWidths[0]).toBeGreaterThan(initialWidths[0] ?? 0)
    expect(undoDepth(editor.state)).toBe(depthBeforeDrag)

    // Act
    act(() => {
      dispatchPointer(window, "pointerup", 140)
    })

    // Assert
    expect(undoDepth(editor.state)).toBe(depthBeforeDrag + 1)
  })

  it("restores pre-drag column widths when undoing a completed resize", async () => {
    // Arrange
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    const initialColwidths = editor.getJSON().content?.[0]?.attrs?.colwidths as
      | number[]
      | null
      | undefined
    await resizeFirstColumn()

    const resizedWidths: number[] =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    const baselineFirstColumnWidth = Array.isArray(initialColwidths)
      ? (initialColwidths[0] ?? 0)
      : 100 / 3
    expect(resizedWidths[0]).toBeGreaterThan(baselineFirstColumnWidth)

    // Act
    act(() => {
      editor.commands.undo()
    })

    // Assert
    expect(editor.getJSON().content?.[0]?.attrs?.colwidths ?? null).toEqual(
      initialColwidths ?? null,
    )
  })

  it("shows a newly added row in the editor after the table has been resized", async () => {
    // Arrange
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })
    await resizeFirstColumn()
    const table = getEditorTable(editor)
    const rowCountBefore = table.querySelectorAll("tr").length

    // Act
    act(() => {
      editor.chain().focus().addRowAfter().run()
    })

    // Assert
    expect(editor.getJSON().content?.[0]?.content?.length ?? 0).toBe(
      rowCountBefore + 1,
    )
    const rows = table.querySelectorAll("tr")
    expect(rows).toHaveLength(rowCountBefore + 1)
    const lastRow = rows[rows.length - 1]
    expect(lastRow).toBeDefined()
    expect(lastRow?.getBoundingClientRect().height ?? 0).toBeGreaterThan(1)
    expect(table.scrollHeight).toBe(table.clientHeight)
  })

  it("shows a newly added column in the editor after the table has been resized", async () => {
    // Arrange
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })
    await resizeFirstColumn()
    const table = getEditorTable(editor)
    const columnCountBefore =
      table.querySelectorAll("tr")[0]?.children.length ?? 0

    // Act
    act(() => {
      editor.chain().focus().addColumnAfter().run()
    })

    // Assert
    const tableJson: JSONContent | undefined = editor.getJSON().content?.[0]
    expect(tableJson?.content?.[0]?.content?.length ?? 0).toBe(
      columnCountBefore + 1,
    )
    const colwidths =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    expect(colwidths).toHaveLength(columnCountBefore + 1)
    const firstRowCells = table.querySelectorAll("tr")[0]?.children ?? []
    expect(firstRowCells).toHaveLength(columnCountBefore + 1)
    expect(table.querySelectorAll("col")).toHaveLength(columnCountBefore + 1)
    const lastCell = firstRowCells[firstRowCells.length - 1]
    expect(lastCell).toBeDefined()
    expect(lastCell?.getBoundingClientRect().width ?? 0).toBeGreaterThan(1)
  })

  it("clears drag state and restores pre-drag widths when the pointer is cancelled", async () => {
    // Arrange
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    const table = await waitFor(() => {
      const element = document.querySelector("table")
      expect(element).not.toBeNull()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return element!
    })
    const initialWidths = getColWidths(table)
    const handle = await waitFor(() => {
      const element = document.querySelector(
        '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
      )
      expect(element).not.toBeNull()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return element!
    })

    // Act
    act(() => {
      dispatchPointer(handle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 140)
    })
    expect(isTableColumnResizeDragging(editor)).toBe(true)

    act(() => {
      dispatchPointer(window, "pointercancel", 140)
    })

    // Assert
    expect(isTableColumnResizeDragging(editor)).toBe(false)
    getColWidths(table).forEach((width, index) => {
      expect(width).toBeCloseTo(initialWidths[index] ?? 0, 2)
    })
    const persistedWidths: number[] =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    persistedWidths.forEach((width, index) => {
      expect(width).toBeCloseTo(initialWidths[index] ?? 0, 2)
    })

    // Act
    act(() => {
      dispatchPointer(handle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 160)
    })
    act(() => {
      dispatchPointer(window, "pointerup", 160)
    })

    // Assert
    expect(isTableColumnResizeDragging(editor)).toBe(false)
    expect(getColWidths(table)[0]).toBeGreaterThan(initialWidths[0] ?? 0)
  })
})
