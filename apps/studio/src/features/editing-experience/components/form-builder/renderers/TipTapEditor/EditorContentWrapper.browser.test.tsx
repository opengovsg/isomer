import type { JSONContent } from "@tiptap/react"
import type { Editor as TiptapEditor } from "@tiptap/react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import {
  useAccordionEditor,
  useProseEditor,
} from "~/features/editing-experience/hooks/useTextEditor"
import "~/styles/tiptap.scss"
import { theme } from "~/theme"

import { Editor } from "./components"

const noopMenuBar: EditorMenuBar = () => <></>

const SHORT_PARAGRAPH: JSONContent = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello editor" }],
    },
  ],
}

const tableContent = (): JSONContent => ({
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Table caption" },
      content: [
        {
          type: "tableRow",
          content: ["A", "B"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
        {
          type: "tableRow",
          content: ["1", "2"].map((text) => ({
            type: "tableCell",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
      ],
    },
  ],
})

const clickBottomOfEditor = async (container: HTMLElement) => {
  const proseMirror = container.querySelector(".tiptap")
  if (!proseMirror) {
    throw new Error("Expected a .tiptap editor root")
  }
  await userEvent.click(proseMirror, {
    position: { x: 8, y: proseMirror.clientHeight - 8 },
  })
}

const ProseHarness = ({
  initialContent,
  onEditorReady,
}: {
  initialContent: JSONContent
  onEditorReady?: (editor: TiptapEditor) => void
}) => {
  const editor = useProseEditor({
    data: initialContent,
    handleChange: () => undefined,
  })
  if (!editor) return null
  onEditorReady?.(editor)
  return <Editor isNested menubar={noopMenuBar} editor={editor} />
}

const AccordionHarness = ({
  initialContent,
  onEditorReady,
}: {
  initialContent: JSONContent
  onEditorReady?: (editor: TiptapEditor) => void
}) => {
  const editor = useAccordionEditor({
    data: initialContent,
    handleChange: () => undefined,
  })
  if (!editor) return null
  onEditorReady?.(editor)
  return <Editor isNested menubar={noopMenuBar} editor={editor} />
}

describe("TipTap EditorContentWrapper", () => {
  afterEach(() => {
    cleanup()
  })

  it("fills the scroll container so the editable area is clickable below short content", async () => {
    // Arrange
    let editor: TiptapEditor | undefined
    const { getByTestId } = render(
      <ThemeProvider theme={theme}>
        <ProseHarness
          initialContent={SHORT_PARAGRAPH}
          onEditorReady={(e) => {
            editor = e
          }}
        />
      </ThemeProvider>,
    )
    const scrollContainer = getByTestId("tiptap-editor-scroll-container")
    const proseMirror = scrollContainer.querySelector(".tiptap")
    expect(proseMirror).toBeTruthy()

    await waitFor(() => {
      expect(proseMirror!.clientHeight).toBeGreaterThanOrEqual(
        scrollContainer.clientHeight - 2,
      )
    })

    // Act
    await clickBottomOfEditor(scrollContainer)

    // Assert
    await waitFor(() => {
      expect(editor?.isFocused).toBe(true)
    })
    const { $from } = editor!.state.selection
    expect($from.parentOffset).toBe($from.parent.content.size)
  })

  it("shows a gap cursor below a trailing table when clicking the empty area", async () => {
    // Arrange
    let editor: TiptapEditor | undefined
    const { getByTestId, container } = render(
      <ThemeProvider theme={theme}>
        <AccordionHarness
          initialContent={tableContent()}
          onEditorReady={(e) => {
            editor = e
          }}
        />
      </ThemeProvider>,
    )
    const scrollContainer = getByTestId("tiptap-editor-scroll-container")
    await waitFor(() => {
      expect(scrollContainer.querySelector("table")).toBeTruthy()
    })

    // Act
    await clickBottomOfEditor(scrollContainer)

    // Assert
    await waitFor(() => {
      expect(container.querySelector(".ProseMirror-gapcursor")).toBeTruthy()
    })
    expect(editor?.isFocused).toBe(true)
  })
})
