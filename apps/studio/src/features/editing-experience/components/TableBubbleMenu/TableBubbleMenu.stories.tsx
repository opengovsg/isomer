import type { Meta, StoryObj } from "@storybook/nextjs"
import type { Editor, JSONContent } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { expect, waitFor, within } from "storybook/test"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

import { TableBubbleMenu } from "./TableBubbleMenu"

// A small 3x3 table (1 header row + 2 body rows, 3 columns) — enough to
// exercise every selection kind the bubble menu reacts to.
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
    },
  ],
}

// Finds the document position at the start boundary of the nth cell (any of
// tableCell / tableHeader) in reading order, 0-indexed. Used to build
// CellSelections programmatically in play functions, since Storybook's play
// function can't drive a real mouse drag across table cells. This is the
// position CellSelection.create expects: resolving it yields a ResolvedPos
// whose parent is the cell's tableRow, so `$pos.node(-1)` is the table.
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
  if (found === null) {
    throw new Error(`Could not find cell at index ${index}`)
  }
  return found
}

const TableBubbleMenuHarness = () => {
  const editor = useTextEditor({ data: SEED_CONTENT, handleChange: () => null })

  return (
    <Box
      className="tiptap"
      border="1px solid"
      borderColor="base.divider.strong"
      borderRadius="4px"
      bg="base.canvas.default"
      p="1rem"
      data-testid="table-bubble-menu-harness"
    >
      {editor && <TableBubbleMenu editor={editor} />}
      {editor && <EditorContent editor={editor} data-testid="editor-content" />}
    </Box>
  )
}

const meta: Meta<typeof TableBubbleMenuHarness> = {
  title: "Components/TableBubbleMenu",
  component: TableBubbleMenuHarness,
}

export default meta
type Story = StoryObj<typeof meta>

const getEditorFromCanvas = async (
  canvasElement: HTMLElement,
): Promise<Editor> => {
  const canvas = within(canvasElement)
  await waitFor(() =>
    expect(canvas.getByTestId("table-bubble-menu-harness")).toBeInTheDocument(),
  )
  const proseMirrorEl = canvasElement.querySelector<
    HTMLElement & { editor?: Editor }
  >(".ProseMirror")
  const editor = proseMirrorEl?.editor
  if (!editor) throw new Error("Editor did not mount")
  return editor
}

// No selection: the bubble menu must not render any menu content.
export const NoSelection: Story = {
  play: async ({ canvasElement }) => {
    await getEditorFromCanvas(canvasElement)
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.queryByText("Delete table")).not.toBeInTheDocument(),
    )
  },
}

// A body row selected: add/move/delete row actions should appear.
export const RowSelected: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const anchorCell = nthCellPos(editor, 3) // first body-row cell
    const headCell = nthCellPos(editor, 5) // last body-row cell
    editor.commands.setCellSelection({ anchorCell, headCell })

    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByText("Delete row")).toBeInTheDocument(),
    )
    await expect(canvas.getByText("Add row above")).toBeInTheDocument()
    await expect(canvas.getByText("Move up")).toBeInTheDocument()
    await expect(canvas.getByText("Move down")).toBeInTheDocument()
  },
}

// The header row selected: no Delete row action (would leave the table
// headerless) — only unset/add/move-down per the locked content matrix.
export const HeaderRowSelected: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const anchorCell = nthCellPos(editor, 0)
    const headCell = nthCellPos(editor, 2)
    editor.commands.setCellSelection({ anchorCell, headCell })

    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByText("Unset header row")).toBeInTheDocument(),
    )
    await expect(canvas.queryByText("Delete row")).not.toBeInTheDocument()
  },
}

// A column selected: add/move/delete column + set-as-header actions appear.
export const ColumnSelected: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const anchorCell = nthCellPos(editor, 0)
    const headCell = nthCellPos(editor, 6)
    editor.commands.setCellSelection({ anchorCell, headCell })

    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByText("Delete column")).toBeInTheDocument(),
    )
    await expect(canvas.getByText("Set as header column")).toBeInTheDocument()
  },
}

// An irregular multi-cell block selected (not a full row or column): only
// Merge cells is offered.
export const MultipleCellsSelected: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)
    const anchorCell = nthCellPos(editor, 3)
    const headCell = nthCellPos(editor, 7)
    editor.commands.setCellSelection({ anchorCell, headCell })

    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByText("Merge cells")).toBeInTheDocument(),
    )
    await expect(canvas.queryByText("Delete row")).not.toBeInTheDocument()
    await expect(canvas.queryByText("Delete column")).not.toBeInTheDocument()
  },
}

// A single cell that came from a previous merge (colspan/rowspan > 1) is the
// one single-cell case with a bubble menu — its only way back is Split cell.
// An ordinary single cell (never merged) still shows no menu at all.
export const MergedCellSelected: Story = {
  play: async ({ canvasElement }) => {
    const editor = await getEditorFromCanvas(canvasElement)

    const mergeAnchor = nthCellPos(editor, 3)
    const mergeHead = nthCellPos(editor, 4)
    editor.commands.setCellSelection({
      anchorCell: mergeAnchor,
      headCell: mergeHead,
    })
    editor.chain().focus().mergeCells().run()

    const mergedCellPos = nthCellPos(editor, 3)
    editor.commands.setCellSelection({
      anchorCell: mergedCellPos,
      headCell: mergedCellPos,
    })

    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByText("Split cell")).toBeInTheDocument(),
    )
    await expect(canvas.queryByText("Merge cells")).not.toBeInTheDocument()
  },
}
