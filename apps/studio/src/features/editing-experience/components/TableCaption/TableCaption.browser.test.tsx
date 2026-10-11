import type { JSONContent } from "@tiptap/react"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor, within } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { Editor } from "~/features/editing-experience/components/form-builder/renderers/TipTapEditor/components"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
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
}: {
  initialContent: JSONContent
  onEditorReady?: (editor: TiptapEditor) => void
}) => {
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  )
  const editor = useTextEditor({ data: content, handleChange: setContent })

  if (editor) onEditorReady?.(editor)

  if (!editor) return null

  return (
    <Editor
      editor={editor}
      menubar={() => <button type="button">Page toolbar</button>}
    />
  )
}

const renderHarness = (initialContent: JSONContent) => {
  let editor: TiptapEditor | undefined
  const utils = render(
    <ThemeProvider theme={theme}>
      <Harness
        initialContent={initialContent}
        onEditorReady={(e) => {
          editor = e
        }}
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
    expect(editTableButton).not.toHaveTextContent("Expand")
    expect(
      captionButton.compareDocumentPosition(editTableButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("expands the same editor around that table", async () => {
    // Arrange
    renderHarness({
      type: "prose",
      content: [
        tableContent("First table"),
        {
          type: "paragraph",
          content: [{ type: "text", text: "between tables" }],
        },
        tableContent("Second table"),
      ],
    })

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
    expect(modal.getByText("First table")).toBeInTheDocument()
    expect(modal.getByText("Second table")).toBeInTheDocument()
    expect(modal.getByText("between tables")).toBeInTheDocument()
    expect(
      modal.getByRole("button", { name: "Page toolbar" }),
    ).toBeInTheDocument()
    expect(modal.getByRole("button", { name: "Done" })).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")
    expect(
      screen.getByRole("dialog", { name: "Expanded table" }),
    ).toBeInTheDocument()
  })

  it("edits the table in place and closes without a separate save", async () => {
    // Arrange
    const { getEditor } = renderHarness({
      type: "prose",
      content: [
        tableContent("Keep me"),
        {
          type: "paragraph",
          content: [{ type: "text", text: "between tables" }],
        },
        tableContent("Leave me"),
      ],
    })
    await screen.findByText("Leave me")

    // Act
    const editButtons = await screen.findAllByRole("button", {
      name: "Expand table",
    })
    await userEvent.click(editButtons[1]!)
    const dialog = await screen.findByRole("dialog", {
      name: "Expanded table",
    })
    const cell = within(dialog).getAllByText("Row 1, A")[1]
    if (!cell) throw new Error("expected the second table cell")
    await userEvent.click(cell)
    await userEvent.keyboard("X")

    const cellTexts = () => {
      const texts: string[] = []
      getEditor()!.state.doc.descendants((node) => {
        if (node.type.name === "tableCell") texts.push(node.textContent)
      })
      return texts
    }

    // The expanded view is the page editor, so the edit is already saved.
    await waitFor(() => {
      const texts = cellTexts()
      expect(texts[0]).toBe("Row 1, A")
      expect(texts[1]).toBe("Row 1, B")
      expect(texts[2]).toContain("X")
      expect(texts[3]).toBe("Row 1, B")
    })

    const edited = cellTexts()
    await userEvent.click(within(dialog).getByRole("button", { name: "Done" }))

    // Assert
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Expanded table" }),
      ).not.toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["Keep me", "Leave me"])
    expect(cellTexts()).toEqual(edited)
  })
})
