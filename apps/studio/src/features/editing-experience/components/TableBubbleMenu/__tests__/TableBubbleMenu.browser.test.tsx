// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom. See
// the `*.browser.test.{ts,tsx}` convention in apps/studio/vitest.config.ts.
import type { Editor, JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, cleanup, render, waitFor } from "@testing-library/react"
import { tableEditingKey } from "@tiptap/pm/tables"
import { EditorContent } from "@tiptap/react"
import { useEffect, useState } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"

import { TableBubbleMenu } from "../TableBubbleMenu"
import {
  duplicateSelectedColumns,
  duplicateSelectedRows,
} from "../TableBubbleMenu.duplicate"

const createSeedTable = (caption: string): JSONContent => ({
  type: "table",
  attrs: { caption },
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
})

const SEED_TABLE = createSeedTable("Test table")

const SEED_CONTENT: JSONContent = {
  type: "prose",
  content: [SEED_TABLE],
}

// Two identical 3x3 tables (9 cells each) separated by a paragraph. The
// second table's first body row is cells 12..14 in reading order.
const TWO_TABLES_CONTENT: JSONContent = {
  type: "prose",
  content: [
    createSeedTable("Test table"),
    {
      type: "paragraph",
      content: [{ type: "text", text: "Between tables" }],
    },
    createSeedTable("Second table"),
  ],
}

// Cell start position for CellSelection.create (must resolve to tableRow, not cell content).
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

// Selects cells [startIndex, endIndex] in reading order inside act().
const selectCells = (editor: Editor, startIndex: number, endIndex: number) => {
  const anchorCell = nthCellPos(editor, startIndex)
  const headCell = nthCellPos(editor, endIndex)
  act(() => {
    editor.chain().focus().setCellSelection({ anchorCell, headCell }).run()
  })
}

const activateTableBubbleMenu = async (
  findByRole: (role: string, options: { name: string }) => Promise<HTMLElement>,
) => {
  const trigger = await findByRole("button", { name: "Table actions" })
  act(() => {
    trigger.click()
  })
}

const tabToTableActionsTrigger = async (
  editor: Editor,
  findByRole: (role: string, options: { name: string }) => Promise<HTMLElement>,
  { expectInactive = true }: { expectInactive?: boolean } = {},
) => {
  const trigger = await findByRole("button", { name: "Table actions" })
  expect(editor.view.dom.contains(document.activeElement)).toBe(true)

  for (
    let tabs = 0;
    tabs < 10 && document.activeElement !== trigger;
    tabs += 1
  ) {
    await userEvent.tab()
  }

  expect(document.activeElement).toBe(trigger)
  if (expectInactive) {
    expect(trigger).toHaveAttribute("aria-pressed", "false")
  }
  return trigger
}

const expectKeyboardActivationOpensMenu = async ({
  editor,
  findByRole,
  findByText,
  queryByText,
  activationKey,
}: {
  editor: Editor
  findByRole: (role: string, options: { name: string }) => Promise<HTMLElement>
  findByText: (text: string) => Promise<HTMLElement>
  queryByText: (text: string) => HTMLElement | null
  activationKey: "{Enter}" | "{Space}"
}) => {
  // Arrange
  selectCells(editor, 3, 5)
  const trigger = await tabToTableActionsTrigger(editor, findByRole)

  // Assert: pre-activation
  expect(trigger).toBeTruthy()
  expect(document.activeElement).toBe(trigger)
  expect(queryByText("Delete row")).toBeNull()

  // Act
  await userEvent.keyboard(activationKey)

  // Assert
  expect(editor.view.dom.contains(document.activeElement)).toBe(true)
  expect(await findByText("Delete row")).toBeTruthy()
}

const Harness = ({
  onReady,
  showMenu = true,
  data = SEED_CONTENT,
}: {
  onReady: (editor: Editor) => void
  showMenu?: boolean
  data?: JSONContent
}) => {
  const editor = useTextEditor({ data, handleChange: () => null })
  useEffect(() => {
    if (editor) onReady(editor)
  }, [editor, onReady])
  return (
    <>
      {editor && showMenu && <TableBubbleMenu editor={editor} />}
      {editor && <EditorContent editor={editor} />}
    </>
  )
}

const renderHarness = async (data: JSONContent = SEED_CONTENT) => {
  let editor: Editor | undefined
  let setShowMenu: ((showMenu: boolean) => void) | undefined

  const ControlledHarness = () => {
    const [showMenu, setShowMenuState] = useState(true)
    setShowMenu = setShowMenuState
    return (
      <Harness onReady={(e) => (editor = e)} showMenu={showMenu} data={data} />
    )
  }

  const utils = render(
    <ThemeProvider theme={theme}>
      <ControlledHarness />
    </ThemeProvider>,
  )
  await waitFor(() => {
    if (!editor || !setShowMenu) throw new Error("editor not ready")
  })
  // Non-null by the waitFor above.
  return {
    ...utils,
    editor: editor!,
    setShowMenu: (showMenu: boolean) => {
      setShowMenu!(showMenu)
    },
  }
}

// First-row cell text contents in left-to-right order, used to assert
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

// Cell text contents for the nth table row (0-indexed), left-to-right.
const rowTextsAt = (editor: Editor, rowIndex: number): string[] => {
  const texts: string[] = []
  let foundTable = false
  editor.state.doc.descendants((node) => {
    if (foundTable) return false
    if (node.type.name !== "table") return true
    foundTable = true
    const row = node.child(rowIndex)
    row.forEach((cell) => {
      texts.push(cell.textContent)
    })
    return false
  })
  return texts
}

const tableRowCount = (editor: Editor): number => {
  let count = 0
  editor.state.doc.descendants((node) => {
    if (node.type.name !== "table") return true
    count = node.childCount
    return false
  })
  return count
}

const tableColumnCount = (editor: Editor): number => {
  let count = 0
  editor.state.doc.descendants((node) => {
    if (node.type.name !== "table") return true
    count = node.child(0).childCount
    return false
  })
  return count
}

const rowCellCount = (editor: Editor, rowIndex: number): number => {
  let count = 0
  let foundTable = false
  editor.state.doc.descendants((node) => {
    if (foundTable) return false
    if (node.type.name !== "table") return true
    foundTable = true
    count = node.child(rowIndex).childCount
    return false
  })
  return count
}

describe("TableBubbleMenu", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows row actions (including Delete row) when a body row is selected", async () => {
    // Arrange
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()
    selectCells(editor, 3, 5) // the full body row (not the first row)

    // Act
    await activateTableBubbleMenu(findByRole)

    // Assert
    expect(queryByText("Header row")).toBeNull()
    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Duplicate row")).toBeTruthy()
    expect(await findByText("Move up")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
    expect(await findByText("Delete row")).toBeTruthy()
  })

  it("shows Header row/column only for the exact top row / leftmost column", async () => {
    const { editor, findByRole, queryByRole } = await renderHarness()

    // Arrange: body row, not the top row
    selectCells(editor, 3, 5)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()

    // Arrange: exact header / top row
    selectCells(editor, 0, 2)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(await findByRole("checkbox", { name: "Header row" })).toBeChecked()

    // Arrange: top row + body row (overlaps top row but is not exactly it)
    selectCells(editor, 0, 5)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()

    // Arrange: middle column, not the leftmost column
    selectCells(editor, 1, 7)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()

    // Arrange: exact leftmost column
    selectCells(editor, 0, 6)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).not.toBeChecked()

    // Arrange: leftmost + next column (overlaps leftmost but is not exactly it)
    selectCells(editor, 0, 7)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()
  })

  it("moves a multi-column selection as a block (A,B → right becomes C,A,B)", async () => {
    // Arrange
    const { editor, findByText, findByRole } = await renderHarness()
    selectCells(editor, 0, 7) // full columns A+B
    await activateTableBubbleMenu(findByRole)
    expect(firstRowTexts(editor)).toEqual(["Column A", "Column B", "Column C"])
    const moveRight = await findByText("Move right")

    // Act
    act(() => {
      moveRight.click()
    })

    // Assert
    expect(firstRowTexts(editor)).toEqual(["Column C", "Column A", "Column B"])
  })

  it("duplicates a body row immediately below with the same cell content", async () => {
    // Arrange
    const { editor } = await renderHarness()
    selectCells(editor, 3, 5) // first body row: cells 3-5 ("Row 1, A/B/C")
    expect(tableRowCount(editor)).toBe(3)
    expect(rowTextsAt(editor, 1)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])

    // Act
    act(() => {
      duplicateSelectedRows(editor)
    })

    // Assert
    expect(tableRowCount(editor)).toBe(4)
    expect(rowTextsAt(editor, 1)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    expect(rowTextsAt(editor, 2)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    expect(rowTextsAt(editor, 3)).toEqual(["Row 2, A", "Row 2, B", "Row 2, C"])
  })

  it("duplicates a multi-row selection as a contiguous block", async () => {
    // Arrange
    const { editor } = await renderHarness()
    selectCells(editor, 3, 8) // both body rows: cells 3-8
    expect(tableRowCount(editor)).toBe(3)

    // Act
    act(() => {
      duplicateSelectedRows(editor)
    })

    // Assert
    expect(tableRowCount(editor)).toBe(5)
    expect(rowTextsAt(editor, 1)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    expect(rowTextsAt(editor, 2)).toEqual(["Row 2, A", "Row 2, B", "Row 2, C"])
    expect(rowTextsAt(editor, 3)).toEqual(["Row 1, A", "Row 1, B", "Row 1, C"])
    expect(rowTextsAt(editor, 4)).toEqual(["Row 2, A", "Row 2, B", "Row 2, C"])
  })

  it("duplicates a column immediately to the right with the same cell content", async () => {
    // Arrange
    const { editor } = await renderHarness()
    selectCells(editor, 1, 7) // column B: header cell 1 + body cells 4 and 7
    expect(tableColumnCount(editor)).toBe(3)
    expect(firstRowTexts(editor)).toEqual(["Column A", "Column B", "Column C"])

    // Act
    act(() => {
      duplicateSelectedColumns(editor)
    })

    // Assert
    expect(tableColumnCount(editor)).toBe(4)
    expect(firstRowTexts(editor)).toEqual([
      "Column A",
      "Column B",
      "Column B",
      "Column C",
    ])
    expect(rowTextsAt(editor, 1)).toEqual([
      "Row 1, A",
      "Row 1, B",
      "Row 1, B",
      "Row 1, C",
    ])
  })

  it("duplicates a multi-column selection as a contiguous block", async () => {
    // Arrange
    const { editor } = await renderHarness()
    selectCells(editor, 0, 7) // columns A+B
    expect(firstRowTexts(editor)).toEqual(["Column A", "Column B", "Column C"])

    // Act
    act(() => {
      duplicateSelectedColumns(editor)
    })

    // Assert
    expect(tableColumnCount(editor)).toBe(5)
    expect(firstRowTexts(editor)).toEqual([
      "Column A",
      "Column B",
      "Column A",
      "Column B",
      "Column C",
    ])
  })

  it("duplicates a row that contains a horizontal merge", async () => {
    // Arrange
    const { editor } = await renderHarness()
    selectCells(editor, 3, 4)
    act(() => {
      editor.chain().focus().mergeCells().run()
    })
    const sourceRowTexts = rowTextsAt(editor, 1)
    expect(rowCellCount(editor, 1)).toBe(2)
    selectCells(editor, 3, 4)

    // Act
    act(() => {
      duplicateSelectedRows(editor)
    })

    // Assert
    expect(tableRowCount(editor)).toBe(4)
    expect(rowCellCount(editor, 1)).toBe(2)
    expect(rowCellCount(editor, 2)).toBe(2)
    expect(rowTextsAt(editor, 1)).toEqual(sourceRowTexts)
    expect(rowTextsAt(editor, 2)).toEqual(sourceRowTexts)
    expect(rowTextsAt(editor, 3)).toEqual(["Row 2, A", "Row 2, B", "Row 2, C"])
  })

  it("duplicates a column that contains a vertical merge", async () => {
    // Arrange
    const { editor } = await renderHarness()
    selectCells(editor, 3, 6)
    act(() => {
      editor.chain().focus().mergeCells().run()
    })
    expect(tableColumnCount(editor)).toBe(3)
    expect(rowCellCount(editor, 1)).toBe(3)
    expect(rowCellCount(editor, 2)).toBe(2)
    selectCells(editor, 0, 3)

    // Act
    act(() => {
      duplicateSelectedColumns(editor)
    })

    // Assert
    expect(tableColumnCount(editor)).toBe(4)
    expect(firstRowTexts(editor)).toEqual([
      "Column A",
      "Column A",
      "Column B",
      "Column C",
    ])
    expect(rowCellCount(editor, 1)).toBe(4)
    expect(rowCellCount(editor, 2)).toBe(2)

    const [originalMerged, duplicatedMerged] = rowTextsAt(editor, 1)
    expect(duplicatedMerged).toBe(originalMerged)
    expect(originalMerged).toContain("Row 1, A")
    expect(originalMerged).toContain("Row 2, A")
  })

  it("withholds Duplicate row for header row selections", async () => {
    // Arrange
    const { editor, findByRole, queryByText } = await renderHarness()
    selectCells(editor, 0, 2)
    await activateTableBubbleMenu(findByRole)

    // Assert: menu
    expect(queryByText("Duplicate row")).toBeNull()

    // Act
    act(() => {
      duplicateSelectedRows(editor)
    })

    // Assert: table unchanged
    expect(tableRowCount(editor)).toBe(3)
  })

  it("withholds Duplicate column for header column selections", async () => {
    // Arrange
    const { editor, findByRole, queryByText } = await renderHarness()
    act(() => {
      editor.chain().focus().toggleHeaderColumn().run()
    })
    selectCells(editor, 0, 6)
    await activateTableBubbleMenu(findByRole)

    // Assert: menu
    expect(queryByText("Duplicate column")).toBeNull()

    // Act
    act(() => {
      duplicateSelectedColumns(editor)
    })

    // Assert: table unchanged
    expect(tableColumnCount(editor)).toBe(3)
  })

  it("withholds Add above, Delete and Move when selection includes header row", async () => {
    const { editor, findByText, findByRole, queryByText, queryByRole } =
      await renderHarness()

    // Arrange: full header row
    selectCells(editor, 0, 2)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    const headerToggle = await findByRole("checkbox", { name: "Header row" })
    expect(headerToggle).toBeChecked()
    expect(queryByText("Add row above")).toBeNull()
    expect(await findByText("Add row below")).toBeTruthy()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Duplicate row")).toBeNull()
    expect(queryByText("Move up")).toBeNull()
    expect(queryByText("Move down")).toBeNull()

    // Arrange: header row + body row
    selectCells(editor, 0, 5)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()
    expect(queryByText("Add row above")).toBeNull()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Duplicate row")).toBeNull()
    expect(queryByText("Move up")).toBeNull()
    expect(queryByText("Move down")).toBeNull()
  })

  it("refreshes row actions when header row is toggled off without reselecting", async () => {
    // Arrange
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()
    selectCells(editor, 0, 2)
    await activateTableBubbleMenu(findByRole)
    const headerToggle = await findByRole("checkbox", { name: "Header row" })
    expect(headerToggle).toBeChecked()
    expect(queryByText("Delete row")).toBeNull()

    // Act
    act(() => {
      headerToggle.click()
    })

    // Assert
    await waitFor(() => {
      expect(headerToggle).not.toBeChecked()
    })
    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Delete row")).toBeTruthy()
    expect(await findByText("Duplicate row")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
  })

  it("withholds Add left, Delete and Move when selection includes header column", async () => {
    const { editor, findByText, findByRole, queryByText, queryByRole } =
      await renderHarness()

    // Arrange: leftmost column before header column is enabled
    selectCells(editor, 0, 6)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).not.toBeChecked()
    expect(await findByText("Delete column")).toBeTruthy()
    expect(await findByText("Move right")).toBeTruthy()

    // Arrange: enable header column; same cell range stays selected, so the
    // menu (already open from above) refreshes in place without reactivating.
    act(() => {
      editor.chain().focus().toggleHeaderColumn().run()
    })
    // Assert
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).toBeChecked()
    expect(queryByText("Add column left")).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
    expect(queryByText("Duplicate column")).toBeNull()
    expect(queryByText("Move left")).toBeNull()
    expect(queryByText("Move right")).toBeNull()

    // Arrange: header column + next column
    selectCells(editor, 0, 7)
    // Act
    await activateTableBubbleMenu(findByRole)
    // Assert
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
    expect(queryByText("Duplicate column")).toBeNull()
    expect(queryByText("Move left")).toBeNull()
    expect(queryByText("Move right")).toBeNull()
  })

  it("shows only Merge cells for an irregular multi-cell selection", async () => {
    // Arrange
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()
    selectCells(editor, 3, 7) // irregular 2x2-ish block, not a full row/column

    // Act
    await activateTableBubbleMenu(findByRole)

    // Assert
    expect(await findByText("Merge cells")).toBeTruthy()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
  })

  it("shows no menu content for a plain cursor outside any selection", async () => {
    // Arrange / Act
    const { queryByText, queryByRole } = await renderHarness()

    // Assert
    expect(queryByText("Delete table")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()
    expect(queryByText("Add row above")).toBeNull()
    expect(queryByRole("button", { name: "Table actions" })).toBeNull()
  })

  it.each([
    { activationKey: "{Enter}" as const, label: "Enter" },
    { activationKey: "{Space}" as const, label: "Space" },
  ])(
    "keeps the trigger mounted when tabbing to it and opens the menu with $label",
    async ({ activationKey }) => {
      // Arrange / Act / Assert
      const { editor, findByRole, findByText, queryByText } =
        await renderHarness()

      await expectKeyboardActivationOpensMenu({
        editor,
        findByRole,
        findByText,
        queryByText,
        activationKey,
      })
    },
  )

  it("deactivates when tabbing from the trigger through menu controls to outside", async () => {
    // Arrange
    const { editor, findByRole, findByText, queryByText, queryByRole } =
      await renderHarness()
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    const trigger = await tabToTableActionsTrigger(editor, findByRole, {
      expectInactive: false,
    })
    expect(trigger).toHaveAttribute("aria-pressed", "true")

    const outside = document.createElement("button")
    outside.type = "button"
    outside.textContent = "outside"
    document.body.appendChild(outside)

    try {
      // Act
      for (
        let tabs = 0;
        tabs < 30 && document.activeElement !== outside;
        tabs += 1
      ) {
        await userEvent.tab()
      }

      // Assert
      expect(document.activeElement).toBe(outside)
      await waitFor(() => {
        expect(queryByRole("button", { name: "Table actions" })).toBeNull()
      })
      await waitFor(() => {
        expect(queryByText("Delete row")).toBeNull()
      })
    } finally {
      outside.remove()
    }
  })

  it("shows the pencil trigger without the action menu until it is activated", async () => {
    // Arrange
    const { editor, findByRole, findByText, queryByText } =
      await renderHarness()
    selectCells(editor, 3, 5)
    const trigger = await findByRole("button", { name: "Table actions" })
    expect(trigger).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()

    // Act: open menu
    await activateTableBubbleMenu(findByRole)

    // Assert
    expect(trigger).toHaveAttribute("aria-pressed", "true")
    expect(await findByText("Delete row")).toBeTruthy()

    // Act: close menu
    await activateTableBubbleMenu(findByRole)

    // Assert
    expect(trigger).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()
  })

  it("shows Split cell for a single cell that came from a merge, and nothing for an ordinary single cell", async () => {
    const { editor, findByText, findByRole, queryByText, queryByRole } =
      await renderHarness()

    // Arrange: merge two adjacent body cells, then re-select the result
    selectCells(editor, 3, 4)
    act(() => {
      editor.chain().focus().mergeCells().run()
    })
    selectCells(editor, 3, 3)

    // Act
    await activateTableBubbleMenu(findByRole)

    // Assert: merged single cell
    expect(await findByText("Split cell")).toBeTruthy()
    expect(queryByText("Merge cells")).toBeNull()

    // Arrange / Act: ordinary single cell
    selectCells(editor, 6, 6)

    // Assert: no menu
    expect(queryByText("Split cell")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()
    expect(queryByRole("button", { name: "Table actions" })).toBeNull()
  })

  it("hides when focus moves outside the editor (e.g. Table Settings modal)", async () => {
    // Arrange
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    // Act
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

    // Assert
    await waitFor(() => {
      expect(queryByText("Delete row")).toBeNull()
    })
  })

  it("stays hidden while a cell drag-select is in progress, then shows after it commits", async () => {
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    // Arrange
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    // Act: start cell drag
    act(() => {
      editor.view.dispatch(
        editor.state.tr.setMeta(tableEditingKey, nthCellPos(editor, 3)),
      )
    })

    // Assert: menu hidden during drag
    await waitFor(() => {
      expect(queryByText("Delete row")).toBeNull()
    })
    selectCells(editor, 3, 7)
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()

    // Act: end cell drag
    act(() => {
      editor.view.dispatch(editor.state.tr.setMeta(tableEditingKey, -1))
    })
    await activateTableBubbleMenu(findByRole)

    // Assert: menu reflects new selection
    expect(await findByText("Merge cells")).toBeTruthy()
  })

  it("starts deactivated after remounting with the same editor", async () => {
    // Arrange
    const { editor, findByRole, findByText, queryByText, setShowMenu } =
      await renderHarness()
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    // Act
    act(() => {
      setShowMenu(false)
    })
    act(() => {
      setShowMenu(true)
    })

    // Assert
    const trigger = await findByRole("button", { name: "Table actions" })
    expect(trigger).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()
  })

  it("repositions the menu when the editor's own scroll container scrolls (not just window)", async () => {
    // Arrange
    let editor: Editor | undefined

    const ScrollingHarness = () => {
      const e = useTextEditor({ data: SEED_CONTENT, handleChange: () => null })
      useEffect(() => {
        if (e) editor = e
      }, [e])
      return (
        <div
          data-testid="scroll-parent"
          style={{ height: "80px", overflowY: "auto" }}
        >
          <div style={{ height: "600px" }} />
          {e && <TableBubbleMenu editor={e} />}
          {e && <EditorContent editor={e} />}
        </div>
      )
    }

    const { findByRole, findByText, container } = render(
      <ThemeProvider theme={theme}>
        <ScrollingHarness />
      </ThemeProvider>,
    )
    await waitFor(() => {
      if (!editor) throw new Error("editor not ready")
    })
    const readyEditor = editor!

    selectCells(readyEditor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    await findByText("Delete row")

    const menuEl = document.querySelector(
      "[data-table-bubble-menu]",
    ) as HTMLElement | null
    expect(menuEl).not.toBeNull()

    await waitFor(() => {
      expect(menuEl?.getBoundingClientRect().top).toBeGreaterThan(0)
    })
    const initialTop = menuEl?.getBoundingClientRect().top

    const scrollParent = container.querySelector(
      '[data-testid="scroll-parent"]',
    ) as HTMLElement

    // Act
    act(() => {
      scrollParent.scrollTop = 300
      scrollParent.dispatchEvent(new Event("scroll"))
    })

    // Assert
    await waitFor(() => {
      expect(menuEl?.getBoundingClientRect().top).not.toBe(initialTop)
    })
  })

  it("keeps one trigger and deactivates when selection moves to another table", async () => {
    // Arrange
    const { editor, findByRole, findByText, findAllByRole, queryByText } =
      await renderHarness(TWO_TABLES_CONTENT)
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    // Act
    selectCells(editor, 12, 14)

    // Assert
    const triggers = await findAllByRole("button", { name: "Table actions" })
    expect(triggers).toHaveLength(1)
    expect(triggers[0]).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()
  })
})
