import type { Meta, StoryObj } from "@storybook/nextjs"
import type { Editor, JSONContent } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { useRef } from "react"
import { expect, fireEvent, waitFor, within } from "storybook/test"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

import { TableDragHandles } from "./TableDragHandles"

// A 4-row (1 header + 3 body), 3-column table — enough to exercise row
// hover/drag, column hover/drag, and "header row has no handle" all at once.
const SEED_CONTENT: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Storybook table" },
      content: [
        {
          type: "tableRow",
          content: ["Column A", "Column B", "Column C"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
        ...[1, 2, 3].map((row) => ({
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
    },
  ],
}

const TableDragHandlesHarness = () => {
  const editor = useTextEditor({ data: SEED_CONTENT, handleChange: () => null })
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <Box p="2rem" maxW="40rem" mx="auto">
      <Box
        ref={containerRef}
        position="relative"
        className="tiptap"
        border="1px solid"
        borderColor="base.divider.strong"
        borderRadius="4px"
        bg="base.canvas.default"
        p="1rem"
        data-testid="table-drag-handles-harness"
      >
        {editor && (
          <TableDragHandles editor={editor} containerRef={containerRef} />
        )}
        {editor && (
          <EditorContent editor={editor} data-testid="editor-content" />
        )}
      </Box>
    </Box>
  )
}

const meta: Meta<typeof TableDragHandlesHarness> = {
  title: "Features/EditingExperience/TableDragHandles",
  component: TableDragHandlesHarness,
}

export default meta
type Story = StoryObj<typeof meta>

const getEditorFromCanvas = async (
  canvasElement: HTMLElement,
): Promise<Editor> => {
  const canvas = within(canvasElement)
  await waitFor(() =>
    expect(
      canvas.getByTestId("table-drag-handles-harness"),
    ).toBeInTheDocument(),
  )
  const proseMirrorEl = canvasElement.querySelector<
    HTMLElement & { editor?: Editor }
  >(".ProseMirror")
  const editor = proseMirrorEl?.editor
  if (!editor) throw new Error("Editor did not mount")
  return editor
}

const getCellText = (editor: Editor): string[] => {
  const texts: string[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      texts.push(node.textContent)
      return false
    }
    return true
  })
  return texts
}

// Fires a real sequence of mouse events over a target element's centre —
// Storybook's `userEvent.hover` doesn't reliably trigger our window-level
// `mousemove` listener (it targets the element under test, not a synthetic
// pointer path), so this dispatches `mousemove` directly at the desired
// viewport coordinates, mirroring how `TableBubbleMenu.stories.tsx`/
// `TableCaption.stories.tsx` drive TipTap state directly for behaviour a
// literal user gesture can't reliably reproduce in a headless browser.
const hoverAt = (x: number, y: number) => {
  void fireEvent.mouseMove(document, { clientX: x, clientY: y })
}

const centreOf = (el: Element) => {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

// A real cursor continuously emits mousemove events while stationary over an
// element — a single synthetic mousemove can race the component's own rect
// measurement (its rects may still be an all-zero placeholder on the very
// first layout tick, matching bug 1 documented in the ported prototype), so
// this re-fires the same hover on every `waitFor` retry until a real rect has
// been measured and the handle mounts.
const hoverUntil = async (
  x: number,
  y: number,
  check: () => HTMLElement,
): Promise<HTMLElement> =>
  waitFor(() => {
    hoverAt(x, y)
    return check()
  })

// At rest: no grip handles are rendered anywhere.
export const NoHandlesAtRest: Story = {
  play: async ({ canvasElement }) => {
    await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(
        canvas.queryByLabelText("Drag to reorder row"),
      ).not.toBeInTheDocument(),
    )
    await expect(
      canvas.queryByLabelText("Drag to reorder column"),
    ).not.toBeInTheDocument()
  },
}

// Hovering a data row reveals its row handle.
export const HoverDataRowRevealsHandle: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)

    const firstBodyCell = canvas.getByText("Row 1, A")
    const { x, y } = centreOf(firstBodyCell)
    await hoverUntil(x, y, () => canvas.getByLabelText("Drag to reorder row"))

    // Sanity: the doc itself is untouched by merely hovering.
    await expect(getCellText(editor)[3]).toBe("Row 1, A")
  },
}

// Hovering the header row must NOT reveal a row handle — the header row
// itself is not draggable (locked design decision).
export const HoverHeaderRowShowsNoHandle: Story = {
  play: async ({ canvasElement }) => {
    await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)

    const headerCell = canvas.getByText("Column A")
    const { x, y } = centreOf(headerCell)
    hoverAt(x, y)
    // Give the (initially all-zero) rect measurement time to settle and any
    // (incorrect) handle a chance to mount before asserting its absence.
    await new Promise((resolve) => setTimeout(resolve, 100))
    hoverAt(x, y)
    await new Promise((resolve) => setTimeout(resolve, 50))

    await expect(
      canvas.queryByLabelText("Drag to reorder row"),
    ).not.toBeInTheDocument()
  },
}

// Hovering a column header reveals a column handle (header columns remain
// draggable like any other column).
export const HoverColumnHeaderRevealsHandle: Story = {
  play: async ({ canvasElement }) => {
    await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)

    const headerCell = canvas.getByText("Column B")
    const { x, y } = centreOf(headerCell)
    // The column handle sits above the header cell, so hover slightly above
    // the header row (within the widened hover margin) to trigger it, same
    // as a real cursor travelling from inside the table up toward the handle.
    await hoverUntil(x, y - 20, () =>
      canvas.getByLabelText("Drag to reorder column"),
    )
  },
}

// Full drag-and-drop of a data row: mousedown on row 1's handle, mousemove
// down past row 3, mouseup — asserts the document's row order actually
// changed (not just that a handler fired).
export const DragRowReorders: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)

    await expect(getCellText(editor).slice(3, 6)).toEqual([
      "Row 1, A",
      "Row 1, B",
      "Row 1, C",
    ])

    const firstBodyCell = canvas.getByText("Row 1, A")
    const { x, y } = centreOf(firstBodyCell)
    const handle = await hoverUntil(x, y, () =>
      canvas.getByLabelText("Drag to reorder row"),
    )
    const handleCentre = centreOf(handle)

    void fireEvent.mouseDown(handle, {
      clientX: handleCentre.x,
      clientY: handleCentre.y,
    })

    const thirdBodyCell = canvas.getByText("Row 3, A")
    const targetPos = centreOf(thirdBodyCell)
    void fireEvent.mouseMove(document, {
      clientX: handleCentre.x,
      clientY: targetPos.y + 15, // past row 3's midpoint -> drop after row 3
    })
    void fireEvent.mouseUp(document, {
      clientX: handleCentre.x,
      clientY: targetPos.y + 15,
    })

    // Row 1 should now be the last body row: reading order becomes
    // Row 2, Row 3, Row 1.
    await waitFor(async () => {
      const cells = getCellText(editor)
      await expect(cells.slice(3, 6)).toEqual([
        "Row 2, A",
        "Row 2, B",
        "Row 2, C",
      ])
      await expect(cells.slice(9, 12)).toEqual([
        "Row 1, A",
        "Row 1, B",
        "Row 1, C",
      ])
    })
  },
}

// Full drag-and-drop of a column: mousedown on column A's handle, mousemove
// past column C, mouseup — asserts the document's column order changed.
export const DragColumnReorders: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)

    await expect(getCellText(editor).slice(0, 3)).toEqual([
      "Column A",
      "Column B",
      "Column C",
    ])

    const headerCell = canvas.getByText("Column A")
    const { x, y } = centreOf(headerCell)
    const handle = await hoverUntil(x, y - 20, () =>
      canvas.getByLabelText("Drag to reorder column"),
    )
    const handleCentre = centreOf(handle)

    void fireEvent.mouseDown(handle, {
      clientX: handleCentre.x,
      clientY: handleCentre.y,
    })

    const columnCCell = canvas.getByText("Column C")
    const targetPos = centreOf(columnCCell)
    void fireEvent.mouseMove(document, {
      clientX: targetPos.x + 20, // past column C's midpoint -> drop after it
      clientY: handleCentre.y,
    })
    void fireEvent.mouseUp(document, {
      clientX: targetPos.x + 20,
      clientY: handleCentre.y,
    })

    // Column A should now be last: reading order becomes B, C, A.
    await waitFor(async () => {
      await expect(getCellText(editor).slice(0, 3)).toEqual([
        "Column B",
        "Column C",
        "Column A",
      ])
    })
  },
}
