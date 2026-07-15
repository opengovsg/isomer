// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom — see
// the `*.browser.test.{ts,tsx}` convention in apps/studio/vitest.config.ts.
import type { Editor, JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, render, waitFor } from "@testing-library/react"
import { tableEditingKey } from "@tiptap/pm/tables"
import { EditorContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"

import { TABLE_BUBBLE_MENU_Z_INDEX, TableBubbleMenu } from "./TableBubbleMenu"

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
        ...[1, 2].map((row) => ({
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

// Finds the document position at the start boundary of the nth cell
// (tableCell or tableHeader) in reading order, 0-indexed. This is the
// position CellSelection.create expects: resolving it yields a ResolvedPos
// whose parent is the cell's tableRow, so `$pos.node(-1)` is the table (as
// prosemirror-tables' CellSelection constructor requires) — resolving one
// position later (i.e. *inside* the cell) would instead make the row the
// `node(-1)` ancestor and throw "Not a table node".
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

// Selects the cell range [startIndex, endIndex] (inclusive, 0-indexed reading
// order) and flushes the resulting transaction inside `act`, since this
// dispatches synchronously outside of React's own event handling.
const selectCells = (editor: Editor, startIndex: number, endIndex: number) => {
  const anchorCell = nthCellPos(editor, startIndex)
  const headCell = nthCellPos(editor, endIndex)
  act(() => {
    // A real pointer selection focuses the editor. Make that precondition
    // explicit instead of relying on menu rendering to steal focus.
    editor.chain().focus().setCellSelection({ anchorCell, headCell }).run()
  })
}

const Harness = ({ onReady }: { onReady: (editor: Editor) => void }) => {
  const editor = useTextEditor({ data: SEED_CONTENT, handleChange: () => null })
  if (editor) onReady(editor)
  return (
    <>
      {editor && <TableBubbleMenu editor={editor} />}
      {editor && <EditorContent editor={editor} />}
    </>
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
  // Non-null by the waitFor above.
  return { ...utils, editor: editor! }
}

// First-row cell text contents in left-to-right order — used to assert
// column reordering after Move left/right.
const firstRowTexts = (editor: Editor): string[] => {
  const texts: string[] = []
  let foundTable = false
  editor.state.doc.descendants((node) => {
    if (foundTable) return false
    if (node.type.name !== "table") return true
    foundTable = true
    const firstRow = node.child(0)
    firstRow.forEach((cell) => {
      texts.push(cell.textContent)
    })
    return false
  })
  return texts
}

describe("TableBubbleMenu", () => {
  it("stacks the menu above the selected-cell highlight and table caption", async () => {
    const { editor, findByText, container } = await renderHarness()

    selectCells(editor, 3, 5)

    const action = await findByText("Add row above")
    // Button → ActionGroup → menu VStack → TipTap floating root (where z-index
    // must live so the portal stacks above TableCaption / cell highlight).
    const menuRoot =
      action.closest("button")?.parentElement?.parentElement?.parentElement
    const selectedCell = container.querySelector(".selectedCell")

    expect(menuRoot).not.toBeNull()
    expect(selectedCell).not.toBeNull()

    const menuZIndex = Number(getComputedStyle(menuRoot!).zIndex)
    // `.selectedCell::after` is z-index: 2; TableCaption overlay is z-index: 1.
    expect(menuZIndex).toBe(TABLE_BUBBLE_MENU_Z_INDEX)
    expect(menuZIndex).toBeGreaterThan(2)
  })

  it("shows row actions (including Delete row) when a body row is selected", async () => {
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 3, 5) // the full body row (not the first row)

    expect(queryByText("Header row")).toBeNull()
    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Move up")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
    expect(await findByText("Delete row")).toBeTruthy()
  })

  it("shows Header row/column only when the first row/column is in the selection", async () => {
    const { editor, findByRole, queryByRole } = await renderHarness()

    // Body row — does not include row 0
    selectCells(editor, 3, 5)
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()

    // Header row — includes row 0
    selectCells(editor, 0, 2)
    expect(await findByRole("checkbox", { name: "Header row" })).toBeChecked()

    // Middle column — does not include column 0
    selectCells(editor, 1, 7)
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()

    // Leftmost column — includes column 0
    selectCells(editor, 0, 6)
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).not.toBeChecked()
  })

  it("places the Header row/column toggle above other actions when shown", async () => {
    const { editor, findByRole, findByText } = await renderHarness()

    selectCells(editor, 0, 2) // header row (includes first row)
    const rowToggle = await findByRole("checkbox", { name: "Header row" })
    const addRow = await findByText("Add row above")
    expect(
      rowToggle.compareDocumentPosition(addRow) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    selectCells(editor, 0, 6) // leftmost column (includes first column)
    const colToggle = await findByRole("checkbox", { name: "Header column" })
    const addCol = await findByText("Add column left")
    expect(
      colToggle.compareDocumentPosition(addCol) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("hides Move left/right (and up/down) when the selection is already at that edge", async () => {
    const { editor, findByText, queryByText } = await renderHarness()

    // Leftmost column (A): cells 0, 3, 6
    selectCells(editor, 0, 6)
    expect(queryByText("Move left")).toBeNull()
    expect(await findByText("Move right")).toBeTruthy()

    // Rightmost column (C): cells 2, 5, 8
    selectCells(editor, 2, 8)
    expect(queryByText("Move right")).toBeNull()
    expect(await findByText("Move left")).toBeTruthy()

    // Leftmost two columns (A+B): anchor header A → bottom of B
    selectCells(editor, 0, 7)
    expect(queryByText("Move left")).toBeNull()
    expect(await findByText("Move right")).toBeTruthy()

    // Bottom body row
    selectCells(editor, 6, 8)
    expect(queryByText("Move down")).toBeNull()
    expect(await findByText("Move up")).toBeTruthy()

    // Header row (top)
    selectCells(editor, 0, 2)
    expect(queryByText("Move up")).toBeNull()
    expect(await findByText("Move down")).toBeTruthy()
  })

  it("moves a multi-column selection as a block (A,B → right becomes C,A,B)", async () => {
    const { editor, findByText } = await renderHarness()

    // Full columns A+B
    selectCells(editor, 0, 7)
    expect(firstRowTexts(editor)).toEqual(["Column A", "Column B", "Column C"])

    const moveRight = await findByText("Move right")
    act(() => {
      moveRight.click()
    })

    expect(firstRowTexts(editor)).toEqual(["Column C", "Column A", "Column B"])
  })

  it("excludes Delete row from the header row's action set", async () => {
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    selectCells(editor, 0, 2) // the full header row

    const headerToggle = await findByRole("checkbox", { name: "Header row" })
    expect(headerToggle).toBeChecked()
    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Add row below")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
    // The refined content matrix (issue 06) explicitly drops Delete row for
    // the header row, to avoid leaving the table with no header.
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Move up")).toBeNull()
  })

  it("shows only Merge cells for an irregular multi-cell selection", async () => {
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 3, 7) // an irregular 2x2-ish block, not a full row/column

    expect(await findByText("Merge cells")).toBeTruthy()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
  })

  it("shows no menu content for a plain cursor outside any selection", async () => {
    const { queryByText } = await renderHarness()

    expect(queryByText("Delete table")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()
    expect(queryByText("Add row above")).toBeNull()
  })

  it("shows Split cell for a single cell that came from a merge, and nothing for an ordinary single cell", async () => {
    const { editor, findByText, queryByText } = await renderHarness()

    // Merge two adjacent body cells into one, then re-select just that
    // resulting cell — the only single-cell case with a bubble menu.
    selectCells(editor, 3, 4)
    act(() => {
      editor.chain().focus().mergeCells().run()
    })
    selectCells(editor, 3, 3)

    expect(await findByText("Split cell")).toBeTruthy()
    expect(queryByText("Merge cells")).toBeNull()

    // An ordinary (never-merged) single cell still shows no menu at all.
    selectCells(editor, 6, 6)
    expect(queryByText("Split cell")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()
  })

  it("does not show Superscript/Subscript when the text cursor is inside a cell", async () => {
    // Arrange
    const { editor, queryByText } = await renderHarness()
    const cellPos = nthCellPos(editor, 3)

    // Act — place a plain text cursor inside the cell (what a click does),
    // not a CellSelection.
    act(() => {
      editor.commands.setTextSelection(cellPos + 1)
    })

    // Assert
    expect(queryByText("Superscript")).toBeNull()
    expect(queryByText("Subscript")).toBeNull()
    expect(queryByText("Delete row")).toBeNull()
  })

  it("hides when focus moves outside the editor (e.g. Table Settings modal)", async () => {
    // TipTap's blur handler hides the menu when focus leaves the editor.
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 3, 5)
    expect(await findByText("Delete row")).toBeTruthy()

    act(() => {
      const outside = document.createElement("button")
      outside.type = "button"
      outside.textContent = "outside"
      document.body.appendChild(outside)
      editor.view.dom.dispatchEvent(
        new FocusEvent("blur", { bubbles: true, relatedTarget: outside }),
      )
      outside.focus()
    })

    await waitFor(() => {
      expect(queryByText("Delete row")).toBeNull()
    })
  })

  it("does not resync BubbleMenu on blur/focus meta traffic after a CellSelection", async () => {
    // Hang path: Modal FocusLock ↔ TipTap blur/focus meta transactions
    // re-render BubbleMenu; useMenuElementProps rebinds listeners each
    // render. memo + selection-only kind updates must keep this finite.
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 3, 5)
    expect(await findByText("Delete row")).toBeTruthy()

    const outside = document.createElement("button")
    outside.type = "button"
    outside.textContent = "outside"
    document.body.appendChild(outside)

    act(() => {
      editor.view.dom.dispatchEvent(
        new FocusEvent("blur", { bubbles: true, relatedTarget: outside }),
      )
      outside.focus()
    })

    await waitFor(() => {
      expect(queryByText("Delete row")).toBeNull()
    })

    act(() => {
      for (let i = 0; i < 40; i += 1) {
        editor.view.dispatch(
          editor.state.tr
            .setMeta("blur", { event: new FocusEvent("blur") })
            .setMeta("addToHistory", false),
        )
        editor.view.dispatch(
          editor.state.tr
            .setMeta("focus", { event: new FocusEvent("focus") })
            .setMeta("addToHistory", false),
        )
      }
    })

    expect(queryByText("Delete row")).toBeNull()
  })

  it("stays hidden while a cell drag-select is in progress, then shows after it commits", async () => {
    // prosemirror-tables sets `tableEditingKey` for the duration of a cell
    // drag (mousemove) and clears it on mouseup. The menu must not appear for
    // intermediate selection rects during that window.
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 3, 5)
    expect(await findByText("Delete row")).toBeTruthy()

    act(() => {
      editor.view.dispatch(
        editor.state.tr.setMeta(tableEditingKey, nthCellPos(editor, 3)),
      )
    })
    await waitFor(() => {
      expect(queryByText("Delete row")).toBeNull()
    })

    // Intermediate selection expansion while still "dragging"
    selectCells(editor, 3, 7)
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()

    // mouseup clears selectingCells state (meta -1 → null)
    act(() => {
      editor.view.dispatch(editor.state.tr.setMeta(tableEditingKey, -1))
    })
    expect(await findByText("Merge cells")).toBeTruthy()
  })
})
