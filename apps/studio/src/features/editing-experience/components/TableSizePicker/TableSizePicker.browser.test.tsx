import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { afterEach, describe, expect, it } from "vitest"
import { theme } from "~/theme"

import { useTextEditor } from "../../hooks/useTextEditor"
import { TableSizePicker } from "./TableSizePicker"

// A minimal harness that mounts a real TipTap editor (the same extensions
// used in the actual page editor, via `useTextEditor`) so these tests exercise
// `insertTable`/`deleteTable` against a real document instead of a mocked
// editor.
const TableSizePickerHarness = () => {
  const editor = useTextEditor({
    data: { type: "prose", content: [{ type: "paragraph" }] },
    handleChange: () => {
      // no-op: tests only assert on the editor's own document state
    },
  })

  if (!editor) {
    return null
  }

  return (
    <>
      <TableSizePicker editor={editor} />
      <EditorContent editor={editor} />
    </>
  )
}

const renderHarness = () =>
  render(
    <ThemeProvider theme={theme}>
      <TableSizePickerHarness />
    </ThemeProvider>,
  )

describe("TableSizePicker", () => {
  afterEach(() => {
    cleanup()
  })

  it("does not show the size grid until the button is clicked", () => {
    renderHarness()
    expect(screen.queryByRole("group", { name: "Select table size" })).toBe(
      null,
    )
  })

  it("opens the size grid popover on click", async () => {
    renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Table" }))

    // Chakra's Popover content mounts via a Framer Motion enter transition,
    // so it isn't immediately part of the accessible tree — `findByRole`
    // polls until the transition settles.
    expect(
      await screen.findByRole("group", { name: "Select table size" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Insert table")).toBeInTheDocument()
  })

  it("highlights the top-left rectangle up to the hovered cell and labels it", async () => {
    renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Table" }))

    // Row index 2, column index 3 (0-indexed) => a 3 x 4 table.
    const targetCell = await screen.findByRole("button", {
      name: "3 by 4 table",
    })
    fireEvent.mouseEnter(targetCell)

    expect(screen.getByText("3 × 4")).toBeInTheDocument()

    const outsideCell = screen.getByRole("button", { name: "4 by 4 table" })
    const neutralBackground = getComputedStyle(outsideCell).backgroundColor

    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= 3; col++) {
        const cell = screen.getByRole("button", {
          name: `${row + 1} by ${col + 1} table`,
        })
        expect(getComputedStyle(cell).backgroundColor).not.toBe(
          neutralBackground,
        )
      }
    }

    expect(getComputedStyle(outsideCell).backgroundColor).toBe(
      neutralBackground,
    )
  })

  it("inserts a table with the clicked dimensions and closes the popover", async () => {
    renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Table" }))

    const targetCell = await screen.findByRole("button", {
      name: "3 by 4 table",
    })
    fireEvent.click(targetCell)

    await waitFor(() => {
      expect(screen.queryByRole("group", { name: "Select table size" })).toBe(
        null,
      )
    })

    const rows = screen.getAllByRole("row")
    expect(rows).toHaveLength(3)

    const headerCells = screen.getAllByRole("columnheader")
    expect(headerCells).toHaveLength(4)
  })

  it("shows a delete-table button instead of the grid picker once a table is active", async () => {
    renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Table" }))
    const targetCell = await screen.findByRole("button", {
      name: "2 by 2 table",
    })
    fireEvent.click(targetCell)

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Table" })).toBe(null)
    })

    expect(
      screen.getByRole("button", { name: "Delete table" }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Delete table" }))

    await waitFor(() => {
      expect(screen.queryByRole("row")).toBe(null)
    })
    expect(
      await screen.findByRole("button", { name: "Table" }),
    ).toBeInTheDocument()
  })

  it("shows the delete-table button in its active (highlighted) state, matching the old Table button's behaviour while inside a table", async () => {
    renderHarness()

    // Neutral baseline: the button's own background before a table exists.
    const neutralBackground = getComputedStyle(
      screen.getByRole("button", { name: "Table" }),
    ).backgroundColor

    fireEvent.click(screen.getByRole("button", { name: "Table" }))
    const targetCell = await screen.findByRole("button", {
      name: "2 by 2 table",
    })
    fireEvent.click(targetCell)

    const deleteButton = await screen.findByRole("button", {
      name: "Delete table",
    })
    expect(getComputedStyle(deleteButton).backgroundColor).not.toBe(
      neutralBackground,
    )
  })
})
