import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { useTextEditor } from "../../hooks/useTextEditor"
import { TableSizePicker } from "./TableSizePicker"

// A minimal harness that mounts a real TipTap editor (the same extensions
// used in the actual page editor, via `useTextEditor`) so the stories below
// can exercise `insertTable` against a real document instead of a mock.
const TableSizePickerHarness = () => {
  const editor = useTextEditor({
    data: { type: "prose", content: [{ type: "paragraph" }] },
    handleChange: () => {
      // no-op: stories only assert on the editor's own document state
    },
  })

  if (!editor) {
    return null
  }

  return (
    <Box>
      <TableSizePicker editor={editor} />
      <Box mt="1rem" border="1px dashed" borderColor="base.divider.medium">
        <EditorContent editor={editor} />
      </Box>
    </Box>
  )
}

const meta: Meta<typeof TableSizePickerHarness> = {
  title: "Features/EditingExperience/TableSizePicker",
  component: TableSizePickerHarness,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Table" })
    await expect(button).toBeVisible()
    await expect(
      canvas.queryByRole("group", { name: "Select table size" }),
    ).not.toBeInTheDocument()
  },
}

export const OpensPopover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Table" })
    await userEvent.click(button)

    const grid = await canvas.findByRole("group", {
      name: "Select table size",
    })
    await expect(grid).toBeVisible()
    await expect(canvas.getByText("Insert table")).toBeVisible()
  },
}

export const HoverHighlightsCells: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Table" })
    await userEvent.click(button)

    // Row index 2, column index 3 (0-indexed) => a 3 x 4 table.
    const targetCell = await canvas.findByRole("button", {
      name: "3 by 4 table",
    })
    await userEvent.hover(targetCell)

    await expect(canvas.getByText("3 × 4")).toBeVisible()

    // A cell just outside the 3 x 4 rectangle stays in its neutral state —
    // use it as the baseline "not highlighted" background for comparison,
    // rather than asserting a hardcoded theme colour value.
    const outsideCell = canvas.getByRole("button", { name: "4 by 4 table" })
    const neutralBackground = getComputedStyle(outsideCell).backgroundColor

    // Every cell within the 3 x 4 rectangle should be highlighted, i.e. its
    // background differs from the neutral background above.
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= 3; col++) {
        const cell = canvas.getByRole("button", {
          name: `${row + 1} by ${col + 1} table`,
        })
        await expect(getComputedStyle(cell).backgroundColor).not.toBe(
          neutralBackground,
        )
      }
    }

    // ...but a cell further outside it stays neutral.
    const furtherOutsideCell = canvas.getByRole("button", {
      name: "1 by 5 table",
    })
    await expect(getComputedStyle(furtherOutsideCell).backgroundColor).toBe(
      neutralBackground,
    )
  },
}

export const ClickInsertsTable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Table" })
    await userEvent.click(button)

    const targetCell = await canvas.findByRole("button", {
      name: "3 by 4 table",
    })
    await userEvent.click(targetCell)

    // Popover closes after commit. Chakra's Popover unmounts its content via a
    // Framer Motion exit transition, so wait for it to actually leave the DOM
    // rather than asserting immediately after the click.
    await waitFor(() =>
      expect(
        canvas.queryByRole("group", { name: "Select table size" }),
      ).not.toBeInTheDocument(),
    )

    // A 3-row x 4-column table (plus header row markup) is now in the doc:
    // one header row with 4 columns, and 2 further body rows.
    const rows = canvas.getAllByRole("row")
    await expect(rows).toHaveLength(3)
    const headerCells = canvas.getAllByRole("columnheader")
    await expect(headerCells).toHaveLength(4)
  },
}
