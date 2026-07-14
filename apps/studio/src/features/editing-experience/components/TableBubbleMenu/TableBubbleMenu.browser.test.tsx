// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom — see
// the `*.browser.test.{ts,tsx}` convention in apps/studio/vitest.config.ts.
import type { Editor, JSONContent } from "@tiptap/react"
import { act, render, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

import { TableBubbleMenu } from "./TableBubbleMenu"

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
    editor.commands.setCellSelection({ anchorCell, headCell })
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
  const utils = render(<Harness onReady={(e) => (editor = e)} />)
  await waitFor(() => {
    if (!editor) throw new Error("editor not ready")
  })
  // Non-null by the waitFor above.
  return { ...utils, editor: editor! }
}

describe("TableBubbleMenu", () => {
  it("shows row actions (including Delete row) when a body row is selected", async () => {
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 3, 5) // the full body row

    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Move up")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
    expect(await findByText("Delete row")).toBeTruthy()
    expect(queryByText("Unset header row")).toBeNull()
  })

  it("excludes Delete row from the header row's action set", async () => {
    const { editor, findByText, queryByText } = await renderHarness()

    selectCells(editor, 0, 2) // the full header row

    expect(await findByText("Unset header row")).toBeTruthy()
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
})
