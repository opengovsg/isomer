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

describe("TableCaption", () => {
  it("renders the empty-state placeholder when the table has no caption", async () => {
    renderHarness({ type: "prose", content: [tableContent("")] })

    expect(await screen.findByText("Add a caption...")).toBeInTheDocument()
  })

  it("renders the existing caption text when the table already has one", async () => {
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    expect(await screen.findByText("Existing caption")).toBeInTheDocument()
  })

  it("commits an edited caption to the table's attribute on blur", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    const placeholder = await screen.findByText("Add a caption...")
    await userEvent.click(placeholder)

    const textarea = await screen.findByPlaceholderText("Add a caption...")
    await userEvent.type(textarea, "A new caption")
    await userEvent.tab()

    await waitFor(() => {
      expect(screen.getByText("A new caption")).toBeInTheDocument()
    })

    const editor = getEditor()
    expect(editor).toBeDefined()
    expect(getTableCaptions(editor!)).toEqual(["A new caption"])
  })

  it("commits on Enter and cancels on Escape without writing", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    // Escape: draft is discarded, no write happens.
    const placeholder = await screen.findByText("Add a caption...")
    await userEvent.click(placeholder)
    const escTextarea = await screen.findByPlaceholderText("Add a caption...")
    await userEvent.type(escTextarea, "should not be saved")
    await userEvent.keyboard("{Escape}")

    await waitFor(() => {
      expect(screen.getByText("Add a caption...")).toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual([""])

    // Enter: commits immediately.
    await userEvent.click(screen.getByText("Add a caption..."))
    const enterTextarea = await screen.findByPlaceholderText("Add a caption...")
    await userEvent.type(enterTextarea, "saved via enter")
    await userEvent.keyboard("{Enter}")

    await waitFor(() => {
      expect(screen.getByText("saved via enter")).toBeInTheDocument()
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["saved via enter"])
  })

  it("truncates input at 200 characters and shows a counter while editing", async () => {
    renderHarness({ type: "prose", content: [tableContent("")] })

    const placeholder = await screen.findByText("Add a caption...")
    await userEvent.click(placeholder)
    const textarea = await screen.findByPlaceholderText("Add a caption...")

    // No counter shown until editing — it appeared as soon as we entered
    // edit mode above, so just assert the "near limit" and "at limit" states.
    await userEvent.type(textarea, "a".repeat(185))
    expect(await screen.findByText("185/200")).toBeInTheDocument()

    await userEvent.type(textarea, "a".repeat(50))
    // Input is truncated at 200 regardless of how many characters were typed.
    expect(await screen.findByText("200/200")).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toHaveLength(200)
  })

  it("renders one caption per table and scopes edits to the correct table instance", async () => {
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
    expect(await screen.findByText("Add a caption...")).toBeInTheDocument()

    // Edit only the second table's (empty) caption.
    await userEvent.click(screen.getByText("Add a caption..."))
    const textarea = await screen.findByPlaceholderText("Add a caption...")
    await userEvent.type(textarea, "Second table caption")
    await userEvent.tab()

    await waitFor(() => {
      expect(screen.getByText("Second table caption")).toBeInTheDocument()
    })
    // The first table's caption must be untouched.
    expect(screen.getByText("First table caption")).toBeInTheDocument()

    const editor = getEditor()
    expect(getTableCaptions(editor!)).toEqual([
      "First table caption",
      "Second table caption",
    ])
  })
})
