import type { ProseProps } from "@opengovsg/isomer-components"
import type { Editor, JSONContent } from "@tiptap/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { render, waitFor } from "@testing-library/react"
import { closeHistory, undoDepth } from "@tiptap/pm/history"
import { EditorContent } from "@tiptap/react"
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ajv } from "~/utils/ajv"

import { useTextEditor } from "../useTextEditor"

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

describe("table column-width resize", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("produces a schema-valid document for a freshly inserted, unresized table", async () => {
    // Arrange: unresized table with colwidth null on every cell.
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
    const handles = document.querySelectorAll(
      '[data-testid="isomer-table-resize-handle"]',
    )
    expect(handles.length).toBe(2) // 3 columns -> 2 interior boundaries
  })

  it("only changes the dragged column and its direct neighbour during a live drag, and persists on release", async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, "error")
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    const table = document.querySelector("table")
    expect(table).not.toBeNull()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableEl = table!
    const initialWidths = getColWidths(tableEl)
    initialWidths.forEach((width) => {
      expect(width).toBeCloseTo(100 / 3, 3)
    })

    const firstHandle = document.querySelector(
      '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
    )
    expect(firstHandle).not.toBeNull()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const handle = firstHandle!

    // Act: drag the first boundary 40px right.
    act(() => {
      dispatchPointer(handle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 140)
    })

    // Assert: column 0 grows, column 1 shrinks, column 2 unchanged; total stays 100%.
    const duringDragWidths = getColWidths(tableEl)
    expect(duringDragWidths[0]).toBeGreaterThan(initialWidths[0] ?? 0)
    expect(duringDragWidths[1]).toBeLessThan(initialWidths[1] ?? 0)
    expect(duringDragWidths[2]).toBeCloseTo(initialWidths[2] ?? 0, 3)
    expect(duringDragWidths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(
      100,
      5,
    )

    // Act: release the drag.
    act(() => {
      dispatchPointer(window, "pointerup", 140)
    })

    // Assert: persisted colwidths match the live preview and sum to 100%.
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
    // Arrange: preview re-renders from editor.onUpdate, not this NodeView's DOM.
    const editor = await renderEditor()
    act(() => {
      editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    })

    const initialWidths: number[] =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    // Arrange: close history so insertTable and the drag are separate undo steps.
    act(() => {
      editor.view.dispatch(closeHistory(editor.state.tr))
    })
    const depthBeforeDrag = undoDepth(editor.state)

    const firstHandle = document.querySelector(
      '[data-testid="isomer-table-resize-handle"][data-column-index="0"]',
    )
    expect(firstHandle).not.toBeNull()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const handle = firstHandle!

    // Act: pointerdown and pointermove, no pointerup yet.
    act(() => {
      dispatchPointer(handle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 140)
    })
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
    })

    // Assert: doc attrs updated before pointerup; mid-drag commit did not add an undo step.
    const midDragWidths: number[] =
      (editor.getJSON().content?.[0]?.attrs?.colwidths as
        | number[]
        | undefined) ?? []
    expect(midDragWidths[0]).toBeGreaterThan(initialWidths[0] ?? 0)
    expect(undoDepth(editor.state)).toBe(depthBeforeDrag)

    // Act: release the drag.
    act(() => {
      dispatchPointer(window, "pointerup", 140)
    })

    // Assert: one undo step for the whole drag.
    expect(undoDepth(editor.state)).toBe(depthBeforeDrag + 1)
  })
})
