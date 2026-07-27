import type { JSONContent } from "@tiptap/react"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useRef, useState } from "react"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"

import { TableCaption } from "./TableCaption"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const editor = useTextEditor({ data: content, handleChange: setContent })

  if (editor) onEditorReady?.(editor)

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <TableCaption editor={editor} containerRef={containerRef} />
      <EditorContent editor={editor} />
    </div>
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

    expect(screen.getByText("Existing caption")).toBeInTheDocument()
    expect(await getCaptionButton("Edit table caption")).toHaveTextContent(
      "Edit",
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

  it("opens the modal with an empty field for placeholder captions", async () => {
    renderHarness({
      type: "prose",
      content: [tableContent(DEFAULT_TABLE_CAPTION)],
    })

    await userEvent.click(await getCaptionButton())

    expect(
      await screen.findByPlaceholderText("This is the caption for your table"),
    ).toHaveValue("")
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

    expect(screen.getByText("First table caption")).toBeInTheDocument()
    const editFirst = await getCaptionButton("Edit table caption")
    const addSecond = await screen.findByRole("button", {
      name: "Add table caption",
    })
    expect(editFirst).toHaveTextContent("Edit")
    expect(addSecond).toHaveTextContent("Add caption")

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
  })
})
