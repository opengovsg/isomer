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

const getCaptionInput = async (name?: string | RegExp) =>
  screen.findByRole("textbox", {
    name: name ?? /add a caption|edit table caption/i,
  })

describe("TableCaption", () => {
  it("renders an always-editable input with placeholder when empty", async () => {
    renderHarness({ type: "prose", content: [tableContent("")] })

    const input = await getCaptionInput("Add a caption")
    expect(input).toHaveAttribute("placeholder", "Add a caption...")
    expect(input).toHaveValue("")
  })

  it("renders the existing caption text when the table already has one", async () => {
    renderHarness({
      type: "prose",
      content: [tableContent("Existing caption")],
    })

    expect(
      await getCaptionInput(/edit table caption: Existing caption/i),
    ).toHaveValue("Existing caption")
  })

  it("updates the table caption attribute as the user types", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    const input = await getCaptionInput()
    await userEvent.click(input)
    await userEvent.type(input, "Live")

    await waitFor(() => {
      expect(getTableCaptions(getEditor()!)).toEqual(["Live"])
    })
  })

  it("commits an edited caption to the table's attribute on blur", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    const input = await getCaptionInput()
    await userEvent.click(input)
    await userEvent.type(input, "A new caption")
    await userEvent.tab()

    await waitFor(() => {
      expect(input).toHaveValue("A new caption")
    })

    const editor = getEditor()
    expect(editor).toBeDefined()
    expect(getTableCaptions(editor!)).toEqual(["A new caption"])
  })

  it("commits on Enter and restores the focus-time caption on Escape", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("")],
    })

    const input = await getCaptionInput()

    // Escape: live writes are undone back to the baseline from focus.
    await userEvent.click(input)
    await userEvent.type(input, "should not be saved")
    await userEvent.keyboard("{Escape}")

    await waitFor(() => {
      expect(input).toHaveValue("")
    })
    expect(getTableCaptions(getEditor()!)).toEqual([""])

    // Enter: keeps the live-written value (trimmed on blur).
    await userEvent.click(input)
    await userEvent.type(input, "saved via enter")
    await userEvent.keyboard("{Enter}")

    await waitFor(() => {
      expect(input).toHaveValue("saved via enter")
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["saved via enter"])
  })

  it("truncates input at 200 characters and shows a counter while focused", async () => {
    renderHarness({ type: "prose", content: [tableContent("")] })

    const input = await getCaptionInput()
    await userEvent.click(input)

    // Paste a long string once — typing 200+ keystrokes is slow and noisy
    // under browser testing (per-keystroke remeasures).
    await userEvent.fill(input, "a".repeat(185))
    expect(await screen.findByText("185/200 characters")).toBeInTheDocument()

    await userEvent.fill(input, "a".repeat(250))
    expect(await screen.findByText("200/200 characters")).toBeInTheDocument()
    expect(input).toHaveValue("a".repeat(200))
  })

  it("does not save an empty caption and restores the previous value on blur", async () => {
    const { getEditor } = renderHarness({
      type: "prose",
      content: [tableContent("Kept caption")],
    })

    const input = await getCaptionInput(/edit table caption: Kept caption/i)
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.tab()

    await waitFor(() => {
      expect(input).toHaveValue("Kept caption")
    })
    expect(getTableCaptions(getEditor()!)).toEqual(["Kept caption"])
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

    const first = await getCaptionInput(
      /edit table caption: First table caption/i,
    )
    const second = await getCaptionInput("Add a caption")
    expect(first).toHaveValue("First table caption")
    expect(second).toHaveValue("")

    // Edit only the second table's (empty) caption.
    await userEvent.click(second)
    await userEvent.type(second, "Second table caption")
    await userEvent.tab()

    await waitFor(() => {
      expect(second).toHaveValue("Second table caption")
    })
    // The first table's caption must be untouched.
    expect(first).toHaveValue("First table caption")

    const editor = getEditor()
    expect(getTableCaptions(editor!)).toEqual([
      "First table caption",
      "Second table caption",
    ])
  })
})
