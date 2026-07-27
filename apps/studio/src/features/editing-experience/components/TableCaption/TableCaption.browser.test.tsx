import type { JSONContent } from "@tiptap/react"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"

import { DEFAULT_TABLE_CAPTION, LEGACY_DEFAULT_TABLE_CAPTION } from "./utils"

const tableContent = (caption: string) => ({
  type: "table",
  attrs: { caption },
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

  // Captions are rendered by the `table` node view, so mounting the editor
  // content is all that is needed here.
  return <EditorContent editor={editor} />
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
    // Arrange
    renderHarness({ type: "prose", content: [tableContent("")] })

    // Assert
    const captionText = await screen.findByText(DEFAULT_TABLE_CAPTION)
    expect(captionText).toBeInTheDocument()
    expect(await getCaptionButton("Add table caption")).toHaveTextContent(
      "Add caption",
    )
  })

  it("renders Add caption for legacy and current default placeholder captions", async () => {
    // Arrange
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

    // Assert
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
    // Arrange
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    // Assert
    const captionText = await screen.findByText("Existing caption")
    expect(captionText).toBeInTheDocument()
    expect(await getCaptionButton("Edit table caption")).toHaveTextContent(
      "Edit",
    )
  })

  it("wraps long caption text across multiple lines", async () => {
    // Arrange
    const longCaption =
      "This is a very long table caption that should wrap onto multiple lines when rendered above the table in the editor"

    renderHarness({
      type: "prose",
      content: [tableContent(longCaption)],
    })

    // Assert
    const captionText = await screen.findByText(longCaption)
    expect(captionText).toHaveStyle({ whiteSpace: "normal" })
    expect(captionText).toHaveStyle({ wordBreak: "break-word" })
  })

  it("shows the default placeholder caption for newly inserted tables", async () => {
    // Arrange
    const { getEditor } = renderHarness({ type: "prose", content: [] })

    await waitFor(() => {
      expect(getEditor()).toBeDefined()
    })

    // Act
    getEditor()!
      .chain()
      .focus()
      .insertTable({ rows: 2, cols: 2, withHeaderRow: true })
      .run()

    // Assert
    await waitFor(() => {
      expect(screen.getByText(DEFAULT_TABLE_CAPTION)).toBeInTheDocument()
    })
    expect(
      await screen.findByRole("button", { name: "Add table caption" }),
    ).toHaveTextContent("Add caption")
  })

  it("opens the table settings modal and saves a new caption", async () => {
    // Arrange
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    // Act
    await userEvent.click(await getCaptionButton())

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.type(textarea, "A new caption")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Table settings")).not.toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["A new caption"])
    expect(screen.getByText("A new caption")).toBeInTheDocument()
  })

  it("opens the modal with an empty field for placeholder captions", async () => {
    // Arrange
    renderHarness({
      type: "prose",
      content: [tableContent(DEFAULT_TABLE_CAPTION)],
    })

    // Act
    await userEvent.click(await getCaptionButton())

    // Assert
    expect(
      await screen.findByPlaceholderText("This is the caption for your table"),
    ).toHaveValue("")
  })

  it("opens the modal pre-filled when editing an existing caption", async () => {
    // Arrange
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    // Act
    await userEvent.click(await getCaptionButton("Edit table caption"))

    // Assert
    expect(
      await screen.findByPlaceholderText("This is the caption for your table"),
    ).toHaveValue("Existing caption")
  })

  it("updates the caption when saving changes in the modal", async () => {
    // Arrange
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("Old caption")],
    })

<<<<<<< HEAD
    // Act
    await userEvent.click(await getCaptionButton("Edit table caption"))
=======
    const input = await getCaptionInput()
    await userEvent.click(input)
    await userEvent.type(input, "Live")
>>>>>>> 9e5b37638 (refactor(TableCaption, TableDragHandles): improve layout handling and test coverage)

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Updated caption")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    // Assert
    await waitFor(() => {
      expect(getTableCaptions(getEditor()!)).toEqual(["Updated caption"])
    })
    expect(screen.getByText("Updated caption")).toBeInTheDocument()
  })

  it("does not save when closing the modal without saving", async () => {
    // Arrange
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("Kept caption")],
    })

    // Act
    await userEvent.click(await getCaptionButton("Edit table caption"))

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Discarded caption")
    await userEvent.click(
      screen.getByRole("button", { name: "Go back to editing" }),
    )

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Table settings")).not.toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["Kept caption"])
    expect(screen.getByText("Kept caption")).toBeInTheDocument()
  })

  it("renders one caption control per table and scopes edits to the correct table instance", async () => {
    // Arrange
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

    // Act
    await userEvent.click(addSecond)

    const textarea = await screen.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.type(textarea, "Second table caption")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    // Assert
    await waitFor(() => {
      expect(getTableCaptions(getEditor()!)).toEqual([
        "First table caption",
        "Second table caption",
      ])
    })
    expect(screen.getByText("Second table caption")).toBeInTheDocument()
    // Both tables now carry a real caption, so both controls read "Edit".
    const editButtons = await screen.findAllByRole("button", {
      name: "Edit table caption",
    })
    expect(editButtons).toHaveLength(2)
    for (const editButton of editButtons) {
      expect(editButton).toHaveTextContent("Edit")
    }
  })
})
