import type { ProseProps } from "@opengovsg/isomer-components"
import type { Editor, JSONContent } from "@tiptap/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { render, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ajv } from "~/utils/ajv"

import { useTextEditor } from "../useTextEditor"

// Same schema + validator EditPageDrawer.tsx uses to decide whether the
// editor's content can be handed to the prose editor at all.
const validateProse = ajv.compile<ProseProps>(
  getComponentSchema({ component: "prose" }),
)

// `useTextEditor` is wired through `~/utils/trpc` transitively via other
// editing-experience modules; this test never calls a trpc procedure, but
// the module reads `env.mjs` (`process.env`) at import time, which doesn't
// exist under Vitest Browser Mode's real-browser runtime.
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
    // Arrange: a table that has never been dragged -- every cell's colwidth
    // is TipTap's declared default (null), not an absent key. This is the
    // exact shape EditPageDrawer.tsx re-validates on every subsequent
    // transaction (e.g. clicking Bold), so it must pass on its own, with no
    // resize interaction involved at all.
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

    // Act: drag the first boundary 40px to the right.
    act(() => {
      dispatchPointer(handle, "pointerdown", 100)
    })
    act(() => {
      dispatchPointer(window, "pointermove", 140)
    })

    // Assert: live preview shows column 0 grown and column 1 (its direct
    // neighbour) shrunk by the same amount, column 2 untouched, and the
    // table's total width hasn't silently drifted off 100%.
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

    // Assert: the commit persisted into the table node's own attrs, matching
    // what was shown live, and the doc still sums to 100.
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
      // Only to 2 decimal places: duringDragWidths comes from the CSS
      // `style.width` string, which the browser serializes with limited
      // precision, unlike the raw float stored in the doc attrs.
      expect(width).toBeCloseTo(duringDragWidths[index] ?? 0, 2)
    })

    // Assert: no unexpected errors were logged during the whole interaction.
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
