import type { JSONContent } from "@tiptap/react"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor, within } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { Editor } from "~/features/editing-experience/components/form-builder/renderers/TipTapEditor/components"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { EXPANDED_TABLE_ATTR } from "~/features/editing-experience/utils/expandTableEditor"
import { theme } from "~/theme"

import { DEFAULT_TABLE_CAPTION, LEGACY_DEFAULT_TABLE_CAPTION } from "./utils"

const tableContent = (caption: string, columnWidths?: number[]) => ({
  type: "table",
  attrs: { caption, ...(columnWidths ? { columnWidths } : {}) },
  content: [
    {
      type: "tableRow",
      content: ["Column A", "Column B"].map((text) => ({
        type: "tableHeader",
        content: [{ type: "paragraph", content: [{ type: "text", text }] }],
      })),
    },
    {
      type: "tableRow",
      content: ["Row 1, A", "Row 1, B"].map((text) => ({
        type: "tableCell",
        content: [{ type: "paragraph", content: [{ type: "text", text }] }],
      })),
    },
  ],
})

const Harness = ({
  initialContent,
  onEditorReady,
  pageAction,
}: {
  initialContent: JSONContent
  onEditorReady?: (editor: TiptapEditor) => void
  pageAction?: string
}) => {
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  )
  const editor = useTextEditor({ data: content, handleChange: setContent })

  if (editor) onEditorReady?.(editor)

  if (!editor) return null

  return (
    <>
      {pageAction ? <button type="button">{pageAction}</button> : null}
      <Editor
        editor={editor}
        menubar={() => <button type="button">Page toolbar</button>}
      />
    </>
  )
}

const renderHarness = (
  initialContent: JSONContent,
  options?: { pageAction?: string },
) => {
  let editor: TiptapEditor | undefined
  const utils = render(
    <ThemeProvider theme={theme}>
      <Harness
        initialContent={initialContent}
        onEditorReady={(e) => {
          editor = e
        }}
        pageAction={options?.pageAction}
      />
    </ThemeProvider>,
  )
  return { ...utils, getEditor: () => editor }
}

const getColumnWidths = (editor: TiptapEditor): unknown => {
  let widths: unknown
  editor.state.doc.descendants((node) => {
    if (node.type.name === "table") {
      widths = node.attrs.columnWidths
      return false
    }
    return true
  })
  return widths
}

const getTableCaptions = (editor: TiptapEditor): string[] => {
  const captions: string[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === "table") {
      captions.push((node.attrs.caption as string | undefined) ?? "")
      return false
    }
    return true
  })
  return captions
}

const tableRanges = (editor: TiptapEditor) => {
  const ranges: { from: number; to: number }[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "table") return true
    ranges.push({ from: pos, to: pos + node.nodeSize })
    return false
  })
  return ranges
}

const nthCellPos = (editor: TiptapEditor, index: number): number => {
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

const selectCells = (
  editor: TiptapEditor,
  startIndex: number,
  endIndex: number,
) => {
  editor
    .chain()
    .focus()
    .setCellSelection({
      anchorCell: nthCellPos(editor, startIndex),
      headCell: nthCellPos(editor, endIndex),
    })
    .run()
}

const placeCaretOnText = (
  editor: TiptapEditor,
  text: string,
  within?: { from: number; to: number },
) => {
  let textPos: number | undefined
  const visit = (node: { isText: boolean; text?: string }, pos: number) => {
    if (textPos !== undefined) return false
    if (node.isText && node.text === text) {
      textPos = pos
      return false
    }
    return true
  }
  if (within) editor.state.doc.nodesBetween(within.from, within.to, visit)
  else editor.state.doc.descendants(visit)
  if (textPos === undefined) throw new Error(`expected text "${text}"`)
  editor.commands.setTextSelection(textPos)
}

const getCaptionButton = async (name?: string | RegExp) =>
  screen.findByRole("button", {
    name: name ?? /add table caption|edit table caption/i,
  })

describe("TableCaption", () => {
  it("renders an Add caption button when the table has no caption", async () => {
    renderHarness({ type: "prose", content: [tableContent("")] })

    expect(await getCaptionButton("Add table caption")).toHaveTextContent(
      "Add caption",
    )
    expect(
      screen.queryByRole("button", { name: "Reset column width" }),
    ).not.toBeInTheDocument()
  })

  it("shows a reset control only after column widths are edited", async () => {
    // Arrange
    renderHarness({
      type: "prose",
      content: [tableContent("Sized columns", [180, 240])],
    })
    const reset = await screen.findByRole("button", {
      name: "Reset column width",
    })

    // Act
    await userEvent.hover(reset)

    // Assert
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Reset column width",
    )
  })

  it("clears edited column widths from the reset control", async () => {
    // Arrange
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("Sized columns", [180, 240])],
    })
    const reset = await screen.findByRole("button", {
      name: "Reset column width",
    })

    // Act
    await userEvent.click(reset)

    // Assert
    await waitFor(() => {
      expect(getColumnWidths(getEditor()!)).toBeNull()
    })
    expect(
      screen.queryByRole("button", { name: "Reset column width" }),
    ).not.toBeInTheDocument()
  })

  it("renders Add caption for legacy and current default placeholder captions", async () => {
    renderHarness({
      type: "prose",
      content: [
        tableContent(LEGACY_DEFAULT_TABLE_CAPTION),
        {
          type: "paragraph",
          content: [{ type: "text", text: "between tables" }],
        },
        tableContent(DEFAULT_TABLE_CAPTION),
      ],
    })

    expect(
      await screen.findByText(LEGACY_DEFAULT_TABLE_CAPTION),
    ).toBeInTheDocument()
    expect(await screen.findByText(DEFAULT_TABLE_CAPTION)).toBeInTheDocument()

    const buttons = await screen.findAllByRole("button", {
      name: "Add table caption",
    })
    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      expect(button).toHaveTextContent("Add caption")
    }
  })

  it("renders the caption text inline with an Edit button when a real caption exists", async () => {
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    const captionText = await screen.findByText("Existing caption")
    expect(captionText).toBeInTheDocument()
    expect(await getCaptionButton("Edit table caption")).toHaveTextContent(
      "Edit caption",
    )
  })

  it("wraps long caption text across multiple lines", async () => {
    const longCaption =
      "This is a very long table caption that should wrap onto multiple lines when rendered above the table in the editor"

    renderHarness({
      type: "prose",
      content: [tableContent(longCaption)],
    })

    const captionText = await screen.findByText(longCaption)
    expect(captionText).toHaveStyle({ whiteSpace: "normal" })
    expect(captionText).toHaveStyle({ wordBreak: "break-word" })
  })

  it("shows the default placeholder caption for newly inserted tables", async () => {
    const { getEditor } = renderHarness({ type: "prose", content: [] })

    await waitFor(() => {
      expect(getEditor()).toBeDefined()
    })

    getEditor()!
      .chain()
      .focus()
      .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
      .run()

    await waitFor(() => {
      expect(screen.getByText(DEFAULT_TABLE_CAPTION)).toBeInTheDocument()
    })
    expect(
      await screen.findByRole("button", { name: "Add table caption" }),
    ).toHaveTextContent("Add caption")
  })

  it("opens the table settings modal and saves a new caption", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    await userEvent.click(await getCaptionButton())

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.type(textarea, "A new caption")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(screen.queryByText("Table settings")).not.toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["A new caption"])
    expect(screen.getByText("A new caption")).toBeInTheDocument()
  })

  it("opens the modal pre-filled with the placeholder caption text", async () => {
    renderHarness({
      type: "prose",
      content: [tableContent(DEFAULT_TABLE_CAPTION)],
    })

    await userEvent.click(await getCaptionButton())

    expect(
      await screen.findByPlaceholderText("This is the caption for your table"),
    ).toHaveValue(DEFAULT_TABLE_CAPTION)
  })

  it("opens the modal pre-filled when editing an existing caption", async () => {
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    await userEvent.click(await getCaptionButton("Edit table caption"))

    expect(
      await screen.findByPlaceholderText("This is the caption for your table"),
    ).toHaveValue("Existing caption")
  })

  it("updates the caption when saving changes in the modal", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("Old caption")],
    })

    await userEvent.click(await getCaptionButton("Edit table caption"))

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Updated caption")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(getTableCaptions(getEditor()!)).toEqual(["Updated caption"])
    })
    expect(screen.getByText("Updated caption")).toBeInTheDocument()
  })

  it("does not save when closing the modal without saving", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("Kept caption")],
    })

    await userEvent.click(await getCaptionButton("Edit table caption"))

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Discarded caption")
    await userEvent.click(
      screen.getByRole("button", { name: "Go back to editing" }),
    )

    await waitFor(() => {
      expect(screen.queryByText("Table settings")).not.toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["Kept caption"])
    expect(screen.getByText("Kept caption")).toBeInTheDocument()
  })

  it("renders one caption control per table and scopes edits to the correct table instance", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [
        tableContent("First table caption"),
        {
          type: "paragraph",
          content: [{ type: "text", text: "text between tables" }],
        },
        tableContent(""),
      ],
    })

    expect(await screen.findByText("First table caption")).toBeInTheDocument()
    const addSecond = await screen.findByRole("button", {
      name: "Add table caption",
    })

    await userEvent.click(addSecond)

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.type(textarea, "Second table caption")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(getTableCaptions(getEditor()!)).toEqual([
        "First table caption",
        "Second table caption",
      ])
    })
    expect(screen.getByText("Second table caption")).toBeInTheDocument()
    const editButtons = await screen.findAllByRole("button", {
      name: "Edit table caption",
    })
    expect(editButtons).toHaveLength(2)
    for (const editButton of editButtons) {
      expect(editButton).toHaveTextContent("Edit caption")
    }
  })

  it("places an expand control to the right of the caption button", async () => {
    // Arrange
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    // Act
    const captionButton = await getCaptionButton("Edit table caption")
    const editTableButton = await screen.findByRole("button", {
      name: "Expand table",
    })

    // Assert
    expect(
      captionButton.compareDocumentPosition(editTableButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  const twoTableContent = (firstCaption: string, secondCaption: string) => ({
    type: "prose" as const,
    content: [
      tableContent(firstCaption),
      {
        type: "paragraph",
        content: [{ type: "text", text: "between tables" }],
      },
      tableContent(secondCaption),
    ],
  })

  it("expands only the table that was opened", async () => {
    // Arrange
    renderHarness(twoTableContent("First table", "Second table"))

    // Act
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)

    // Assert
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })
    await waitFor(() => {
      const bounds = dialog.getBoundingClientRect()
      expect(bounds.width).toBeGreaterThan(window.innerWidth * 0.98)
      expect(bounds.height).toBeGreaterThan(window.innerHeight * 0.98)
    })
    const modal = within(dialog)
    expect(modal.getByText("First table")).toBeVisible()
    expect(modal.getByText("Second table")).not.toBeVisible()
    expect(modal.getByText("between tables")).not.toBeVisible()
    expect(modal.getByRole("button", { name: "Bold" })).toBeInTheDocument()
    expect(
      modal.queryByRole("button", { name: "Page toolbar" }),
    ).not.toBeInTheDocument()
    expect(
      modal.queryByRole("button", { name: "Divider" }),
    ).not.toBeInTheDocument()
    expect(
      modal.queryByRole("button", { name: "Delete table" }),
    ).not.toBeInTheDocument()
    expect(
      modal.getByRole("button", { name: "Back to editing" }),
    ).toBeInTheDocument()
    expect(
      modal.queryByRole("button", { name: "Expand table" }),
    ).not.toBeInTheDocument()
    // Two rows on the opened table. Handles sit outside the hidden siblings,
    // so the other table's handles stay in the DOM unless they are filtered.
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "Drag to reorder row" }),
      ).toHaveLength(2)
    })
  })

  it("keeps the expanded table open when Escape is pressed", async () => {
    // Arrange
    renderHarness(twoTableContent("First table", "Second table"))
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    await screen.findByRole("dialog", { name: "Expanded table" })

    // Act
    await userEvent.keyboard("{Escape}")

    // Assert
    expect(
      screen.getByRole("dialog", { name: "Expanded table" }),
    ).toBeInTheDocument()
  })

  it("moves the caret into the table that was expanded", async () => {
    // Arrange
    const { getEditor } = renderHarness(twoTableContent("Keep me", "Leave me"))
    await screen.findByText("Leave me")
    placeCaretOnText(getEditor()!, "between tables")

    // Act
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[1]!)

    // Assert
    const dialog = await screen.findByRole("dialog", {
      name: "Expanded table",
    })
    await waitFor(() => {
      const { from, to } = getEditor()!.state.selection
      const second = tableRanges(getEditor()!)[1]
      expect(from).toBeGreaterThanOrEqual(second!.from)
      expect(to).toBeLessThanOrEqual(second!.to)
    })
    const modal = within(dialog)
    expect(modal.getByText("Leave me")).toBeVisible()
    expect(modal.getByText("Keep me")).not.toBeVisible()
    expect(modal.getByText("between tables")).not.toBeVisible()
  })

  it("writes a cell edit into the page while the table is expanded", async () => {
    // Arrange
    const { getEditor } = renderHarness(twoTableContent("Keep me", "Leave me"))
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[1]!)
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })
    await waitFor(() => {
      const { from, to } = getEditor()!.state.selection
      const second = tableRanges(getEditor()!)[1]
      expect(from).toBeGreaterThanOrEqual(second!.from)
      expect(to).toBeLessThanOrEqual(second!.to)
    })

    // Act
    const second = tableRanges(getEditor()!)[1]
    placeCaretOnText(getEditor()!, "Row 1, A", second)
    getEditor()!.commands.insertContent("X")

    // Assert
    await waitFor(() => {
      const texts: string[] = []
      getEditor()!.state.doc.descendants((node) => {
        if (node.type.name === "tableCell") texts.push(node.textContent)
      })
      expect(texts[2]).toContain("X")
    })
    expect(within(dialog).getByText("Keep me")).not.toBeVisible()
    expect(within(dialog).getByText("between tables")).not.toBeVisible()
  })

  it("closes the expanded table and keeps the edit", async () => {
    // Arrange
    const { getEditor } = renderHarness(twoTableContent("Keep me", "Leave me"))
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[1]!)
    const dialog = await screen.findByRole("dialog", {
      name: "Expanded table",
    })
    await waitFor(() => {
      const { from, to } = getEditor()!.state.selection
      const second = tableRanges(getEditor()!)[1]
      expect(from).toBeGreaterThanOrEqual(second!.from)
      expect(to).toBeLessThanOrEqual(second!.to)
    })
    const second = tableRanges(getEditor()!)[1]
    placeCaretOnText(getEditor()!, "Row 1, A", second)
    getEditor()!.commands.insertContent("X")
    await waitFor(() => {
      const texts: string[] = []
      getEditor()!.state.doc.descendants((node) => {
        if (node.type.name === "tableCell") texts.push(node.textContent)
      })
      expect(texts[2]).toContain("X")
    })

    // Act
    within(dialog).getByRole("button", { name: "Back to editing" }).click()

    // Assert
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Expanded table" }),
      ).not.toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["Keep me", "Leave me"])
    expect(screen.getByText("Keep me")).toBeVisible()
    expect(screen.getByText("between tables")).toBeVisible()
    expect(screen.getByText("Leave me")).toBeVisible()
    const texts: string[] = []
    getEditor()!.state.doc.descendants((node) => {
      if (node.type.name === "tableCell") texts.push(node.textContent)
    })
    expect(texts[2]).toContain("X")
  })

  it("keeps drag handles beside the table after going back to editing", async () => {
    // Arrange
    renderHarness(twoTableContent("First table", "Second table"))
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })

    // Act
    within(dialog).getByRole("button", { name: "Back to editing" }).click()

    // Assert
    await waitFor(() => {
      const tables = [...document.querySelectorAll("table")]
      const rowHandles = screen.getAllByRole("button", {
        name: "Drag to reorder row",
      })
      const columnHandles = screen.getAllByRole("button", {
        name: "Drag to reorder column",
      })
      expect(tables).toHaveLength(2)
      for (const table of tables) {
        const tableRect = table.getBoundingClientRect()
        expect(
          rowHandles.some((handle) => {
            const rect = handle.getBoundingClientRect()
            const center = rect.top + rect.height / 2
            return (
              center >= tableRect.top &&
              center <= tableRect.bottom &&
              Math.abs(rect.right - tableRect.left) < 48
            )
          }),
        ).toBe(true)
        expect(
          columnHandles.some((handle) => {
            const rect = handle.getBoundingClientRect()
            const center = rect.left + rect.width / 2
            return (
              center >= tableRect.left &&
              center <= tableRect.right &&
              Math.abs(rect.bottom - tableRect.top) < 48
            )
          }),
        ).toBe(true)
      }
    })
  })

  it("bolds the selected cell text from the expanded toolbar", async () => {
    // Arrange
    const { getEditor } = renderHarness(twoTableContent("Keep me", "Leave me"))
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[1]!)
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })
    const editor = getEditor()!
    const second = tableRanges(editor)[1]
    placeCaretOnText(editor, "Row 1, A", second)
    const from = editor.state.selection.from
    editor.commands.setTextSelection({ from, to: from + "Row 1, A".length })

    // Act
    const bold = within(dialog).getByRole("button", { name: "Bold" })
    const rect = bold.getBoundingClientRect()
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    )
    if (!(hit === bold || (hit && bold.contains(hit)))) {
      throw new Error("Bold is covered, so the toolbar cannot be clicked")
    }
    bold.click()

    // Assert
    await waitFor(() => {
      let bold = false
      getEditor()!.state.doc.descendants((node) => {
        if (node.isText && node.text?.includes("Row 1, A")) {
          bold = node.marks.some((mark) => mark.type.name === "bold")
        }
      })
      expect(bold).toBe(true)
    })
  })

  it("shows table actions for a cell selection inside the expanded table", async () => {
    // Arrange
    const { getEditor } = renderHarness(
      twoTableContent("First table", "Second table"),
    )
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })

    // Act
    selectCells(getEditor()!, 2, 3)

    // Assert
    const trigger = await within(dialog).findByRole("button", {
      name: "Table actions",
    })
    trigger.click()
    expect(
      await within(dialog).findByRole("button", { name: "Add row below" }),
    ).toBeInTheDocument()
  })

  it("hides table actions while another dialog is open over the expanded table", async () => {
    // Arrange
    const { getEditor } = renderHarness(
      twoTableContent("First table", "Second table"),
    )
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })
    selectCells(getEditor()!, 2, 3)
    await within(dialog).findByRole("button", { name: "Table actions" })

    // Act
    within(dialog).getByRole("button", { name: "Edit table caption" }).click()
    await screen.findByText("Table settings")

    // Assert
    await waitFor(() => {
      expect(document.querySelector("[data-table-bubble-menu]")).toBeNull()
    })
  })

  it("keeps the expanded table open when the overlay is clicked", async () => {
    // Arrange
    renderHarness(twoTableContent("First table", "Second table"))
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    await screen.findByRole("dialog", { name: "Expanded table" })
    const overlay = document.querySelector(".chakra-modal__overlay")
    if (!(overlay instanceof HTMLElement)) throw new Error("expected overlay")

    // Act
    overlay.click()

    // Assert
    expect(
      screen.getByRole("dialog", { name: "Expanded table" }),
    ).toBeInTheDocument()
  })

  it("keeps a page control outside the expanded table out of tab order", async () => {
    // Arrange
    renderHarness(twoTableContent("First table", "Second table"), {
      pageAction: "Save page",
    })
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    await screen.findByRole("dialog", { name: "Expanded table" })
    const save = [...document.querySelectorAll("button")].find(
      (button) => button.textContent === "Save page",
    )
    if (!save) throw new Error("expected Save page")

    // Act
    for (let tabs = 0; tabs < 12; tabs += 1) {
      await userEvent.tab()
    }

    // Assert
    expect(document.activeElement).not.toBe(save)
  })

  it("hides other content again after the expanded table marker is dropped", async () => {
    // Arrange
    const { getEditor } = renderHarness(
      twoTableContent("First table", "Second table"),
    )
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[0]!)
    const dialog = await screen.findByRole("dialog", { name: "Expanded table" })
    const marked = getEditor()!.view.dom.querySelector(
      `[${EXPANDED_TABLE_ATTR}]`,
    )
    if (!(marked instanceof HTMLElement)) throw new Error("expected marker")
    marked.removeAttribute(EXPANDED_TABLE_ATTR)

    // Act
    placeCaretOnText(getEditor()!, "Row 1, A", tableRanges(getEditor()!)[0])
    getEditor()!.commands.insertContent("Q")

    // Assert
    await waitFor(() => {
      expect(within(dialog).getByText("Second table")).not.toBeVisible()
      expect(within(dialog).getByText("between tables")).not.toBeVisible()
    })
  })
})
