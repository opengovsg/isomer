// Renders a real TipTap editor (ProseMirror needs a real DOM to construct an
// EditorView), so this runs under Vitest Browser Mode rather than jsdom — see
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
  selectCells(editor, 3, 5)
  const trigger = await tabToTableActionsTrigger(editor, findByRole)

  expect(trigger).toBeTruthy()
  expect(document.activeElement).toBe(trigger)
  expect(queryByText("Delete row")).toBeNull()

  await userEvent.keyboard(activationKey)

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
  afterEach(() => {
    cleanup()
  })

  it("shows row actions (including Delete row) when a body row is selected", async () => {
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    selectCells(editor, 3, 5) // the full body row (not the first row)
    await activateTableBubbleMenu(findByRole)

    expect(queryByText("Header row")).toBeNull()
    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Move up")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
    expect(await findByText("Delete row")).toBeTruthy()
  })

  it("shows Header row/column only for the exact top row / leftmost column", async () => {
    const { editor, findByRole, queryByRole } = await renderHarness()

    // Body row — not the top row
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()

    // Exact header / top row
    selectCells(editor, 0, 2)
    await activateTableBubbleMenu(findByRole)
    expect(await findByRole("checkbox", { name: "Header row" })).toBeChecked()

    // Top row + body row — overlaps the top row but is not exactly it
    selectCells(editor, 0, 5)
    await activateTableBubbleMenu(findByRole)
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()

    // Middle column — not the leftmost column
    selectCells(editor, 1, 7)
    await activateTableBubbleMenu(findByRole)
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()

    // Exact leftmost column
    selectCells(editor, 0, 6)
    await activateTableBubbleMenu(findByRole)
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).not.toBeChecked()

    // Leftmost + next column — overlaps leftmost but is not exactly it
    selectCells(editor, 0, 7)
    await activateTableBubbleMenu(findByRole)
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()
  })

  it("moves a multi-column selection as a block (A,B → right becomes C,A,B)", async () => {
    const { editor, findByText, findByRole } = await renderHarness()

    // Full columns A+B
    selectCells(editor, 0, 7)
    await activateTableBubbleMenu(findByRole)
    expect(firstRowTexts(editor)).toEqual(["Column A", "Column B", "Column C"])

    const moveRight = await findByText("Move right")
    act(() => {
      moveRight.click()
    })

    expect(firstRowTexts(editor)).toEqual(["Column C", "Column A", "Column B"])
  })

  it("withholds Add above, Delete and Move when selection includes header row", async () => {
    const { editor, findByText, findByRole, queryByText, queryByRole } =
      await renderHarness()

    selectCells(editor, 0, 2) // the full header row
    await activateTableBubbleMenu(findByRole)

    const headerToggle = await findByRole("checkbox", { name: "Header row" })
    expect(headerToggle).toBeChecked()
    expect(queryByText("Add row above")).toBeNull()
    expect(await findByText("Add row below")).toBeTruthy()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Move up")).toBeNull()
    expect(queryByText("Move down")).toBeNull()

    selectCells(editor, 0, 5)
    await activateTableBubbleMenu(findByRole)
    expect(queryByRole("checkbox", { name: "Header row" })).toBeNull()
    expect(queryByText("Add row above")).toBeNull()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Move up")).toBeNull()
    expect(queryByText("Move down")).toBeNull()
  })

  it("refreshes row actions when header row is toggled off without reselecting", async () => {
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    selectCells(editor, 0, 2)
    await activateTableBubbleMenu(findByRole)

    const headerToggle = await findByRole("checkbox", { name: "Header row" })
    expect(headerToggle).toBeChecked()
    expect(queryByText("Delete row")).toBeNull()

    act(() => {
      headerToggle.click()
    })

    await waitFor(() => {
      expect(headerToggle).not.toBeChecked()
    })
    expect(await findByText("Add row above")).toBeTruthy()
    expect(await findByText("Delete row")).toBeTruthy()
    expect(await findByText("Move down")).toBeTruthy()
  })

  it("withholds Add left, Delete and Move when selection includes header column", async () => {
    const { editor, findByText, findByRole, queryByText, queryByRole } =
      await renderHarness()

    // Seed table has a header row only — leftmost column is still deletable.
    selectCells(editor, 0, 6)
    await activateTableBubbleMenu(findByRole)
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).not.toBeChecked()
    expect(await findByText("Delete column")).toBeTruthy()
    expect(await findByText("Move right")).toBeTruthy()

    act(() => {
      editor.chain().focus().toggleHeaderColumn().run()
    })

    selectCells(editor, 0, 6) // header column alone
    expect(
      await findByRole("checkbox", { name: "Header column" }),
    ).toBeChecked()
    expect(queryByText("Add column left")).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
    expect(queryByText("Move left")).toBeNull()
    expect(queryByText("Move right")).toBeNull()

    selectCells(editor, 0, 7)
    await activateTableBubbleMenu(findByRole)
    expect(queryByRole("checkbox", { name: "Header column" })).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
    expect(queryByText("Move left")).toBeNull()
    expect(queryByText("Move right")).toBeNull()
  })

  it("shows only Merge cells for an irregular multi-cell selection", async () => {
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    selectCells(editor, 3, 7) // an irregular 2x2-ish block, not a full row/column
    await activateTableBubbleMenu(findByRole)

    expect(await findByText("Merge cells")).toBeTruthy()
    expect(queryByText("Delete row")).toBeNull()
    expect(queryByText("Delete column")).toBeNull()
  })

  it("shows no menu content for a plain cursor outside any selection", async () => {
    const { queryByText, queryByRole } = await renderHarness()

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
      for (
        let tabs = 0;
        tabs < 30 && document.activeElement !== outside;
        tabs += 1
      ) {
        await userEvent.tab()
      }

      expect(document.activeElement).toBe(outside)
      // Focus has left the trigger, the menu, and the editor entirely, so
      // both the action list and the now-irrelevant pencil trigger hide.
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
    const { editor, findByRole, findByText, queryByText } =
      await renderHarness()

    selectCells(editor, 3, 5)

    const trigger = await findByRole("button", { name: "Table actions" })
    expect(trigger).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()

    await activateTableBubbleMenu(findByRole)

    expect(trigger).toHaveAttribute("aria-pressed", "true")
    expect(await findByText("Delete row")).toBeTruthy()

    await activateTableBubbleMenu(findByRole)

    expect(trigger).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()
  })

  it("shows Split cell for a single cell that came from a merge, and nothing for an ordinary single cell", async () => {
    const { editor, findByText, findByRole, queryByText, queryByRole } =
      await renderHarness()

    // Merge two adjacent body cells into one, then re-select just that
    // resulting cell — the only single-cell case with a bubble menu.
    selectCells(editor, 3, 4)
    act(() => {
      editor.chain().focus().mergeCells().run()
    })
    selectCells(editor, 3, 3)
    await activateTableBubbleMenu(findByRole)

    expect(await findByText("Split cell")).toBeTruthy()
    expect(queryByText("Merge cells")).toBeNull()

    // An ordinary (never-merged) single cell still shows no menu at all.
    selectCells(editor, 6, 6)
    expect(queryByText("Split cell")).toBeNull()
    expect(queryByText("Merge cells")).toBeNull()
    expect(queryByRole("button", { name: "Table actions" })).toBeNull()
  })

  it("hides when focus moves outside the editor (e.g. Table Settings modal)", async () => {
    // TipTap's blur handler hides the menu when focus leaves the editor.
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
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

  it("stays hidden while a cell drag-select is in progress, then shows after it commits", async () => {
    // prosemirror-tables sets `tableEditingKey` for the duration of a cell
    // drag (mousemove) and clears it on mouseup. The menu must not appear for
    // intermediate selection rects during that window.
    const { editor, findByText, findByRole, queryByText } =
      await renderHarness()

    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
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
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Merge cells")).toBeTruthy()
  })

  it("starts deactivated after remounting with the same editor", async () => {
    const { editor, findByRole, findByText, queryByText, setShowMenu } =
      await renderHarness()
    selectCells(editor, 3, 5)
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    act(() => {
      setShowMenu(false)
    })
    act(() => {
      setShowMenu(true)
    })

    const trigger = await findByRole("button", { name: "Table actions" })
    expect(trigger).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()
  })

  it("repositions the menu when the editor's own scroll container scrolls (not just window)", async () => {
    // EditorContentWrapper (the real production wrapper) has its own
    // `overflowY: auto` — scrolling *inside* it must reposition the menu,
    // not just scrolling the window.
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

    act(() => {
      scrollParent.scrollTop = 300
      scrollParent.dispatchEvent(new Event("scroll"))
    })

    await waitFor(() => {
      expect(menuEl?.getBoundingClientRect().top).not.toBe(initialTop)
    })
  })

  it("keeps one trigger and deactivates when selection moves to another table", async () => {
    const { editor, findByRole, findByText, findAllByRole, queryByText } =
      await renderHarness(TWO_TABLES_CONTENT)

    selectCells(editor, 3, 5) // first table, first body row
    await activateTableBubbleMenu(findByRole)
    expect(await findByText("Delete row")).toBeTruthy()

    selectCells(editor, 12, 14) // second table, first body row

    const triggers = await findAllByRole("button", { name: "Table actions" })
    expect(triggers).toHaveLength(1)
    expect(triggers[0]).toHaveAttribute("aria-pressed", "false")
    expect(queryByText("Delete row")).toBeNull()
  })
})
