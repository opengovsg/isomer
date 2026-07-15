import type { Editor, JSONContent } from "@tiptap/react"
import { act, render, waitFor } from "@testing-library/react"
import { selectedRect } from "@tiptap/pm/tables"
import { EditorContent } from "@tiptap/react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

import {
  getSelectedDragHandleVirtualElement,
  TABLE_EDITOR_OVERLAYS_ATTR,
} from "./TableBubbleMenu.dom"

const CONTENT: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
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
}

const Harness = ({ onReady }: { onReady: (editor: Editor) => void }) => {
  const editor = useTextEditor({ data: CONTENT, handleChange: () => null })
  if (editor) onReady(editor)

  return (
    <div {...{ [TABLE_EDITOR_OVERLAYS_ATTR]: "" }}>
      {editor && <EditorContent editor={editor} />}
    </div>
  )
}

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

const appendSelectedRowHandle = (
  editor: Editor,
  rect: DOMRect,
): HTMLElement => {
  const selectionRect = selectedRect(editor.state)
  const handle = document.createElement("button")
  handle.dataset.tableDragHandle = "row"
  handle.dataset.tablePos = String(selectionRect.tableStart - 1)
  handle.dataset.index = String(selectionRect.top)
  handle.dataset.state = "selected"
  handle.getBoundingClientRect = () => rect
  editor.view.dom
    .closest(`[${TABLE_EDITOR_OVERLAYS_ATTR}]`)
    ?.appendChild(handle)
  return handle
}

describe("TableBubbleMenu DOM scoping", () => {
  it("finds the selected drag handle belonging to the same editor", async () => {
    // Arrange
    const editors: Editor[] = []
    render(
      <>
        <Harness onReady={(editor) => (editors[0] = editor)} />
        <Harness onReady={(editor) => (editors[1] = editor)} />
      </>,
    )
    await waitFor(() => expect(editors).toHaveLength(2))

    const secondEditor = editors[1]!
    act(() => {
      const anchorCell = nthCellPos(secondEditor, 2)
      const headCell = nthCellPos(secondEditor, 3)
      secondEditor
        .chain()
        .focus()
        .setCellSelection({ anchorCell, headCell })
        .run()
    })

    const firstRect = new DOMRect(10, 10, 10, 10)
    const secondRect = new DOMRect(100, 100, 10, 10)
    appendSelectedRowHandle(editors[0]!, firstRect)
    appendSelectedRowHandle(secondEditor, secondRect)

    // Act
    const virtualElement = getSelectedDragHandleVirtualElement(secondEditor)

    // Assert
    expect(virtualElement?.getBoundingClientRect()).toEqual(secondRect)
  })
})
