import type { Meta, StoryObj } from "@storybook/nextjs"
import type { JSONContent } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { useState } from "react"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { TiptapProseEditor } from "~/features/editing-experience/components/form-builder/renderers/TipTapEditor"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

const TABLE_CONTENT: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Quarterly figures" },
      content: [
        {
          type: "tableRow",
          content: ["Column A", "Column B"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
        ...[1, 2].map((row) => ({
          type: "tableRow",
          content: ["A", "B"].map((col) => ({
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
  const [content, setContent] = useState<JSONContent | undefined>(TABLE_CONTENT)
  const editor = useTextEditor({ data: content, handleChange: setContent })

  return (
    <Box p="3rem" maxW="48rem" mx="auto">
      <TiptapProseEditor editor={editor} />
    </Box>
  )
}

const meta: Meta<typeof TableDragHandlesHarness> = {
  title: "Features/EditingExperience/TableDragHandles",
  component: TableDragHandlesHarness,
}

export default meta
type Story = StoryObj<typeof TableDragHandlesHarness>

export const HiddenUntilHover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText("Column A")).toBeInTheDocument()
    await expect(
      canvas.queryByRole("button", { name: "Select entire table" }),
    ).not.toBeInTheDocument()
  },
}

export const SelectEntireTable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cell = await canvas.findByText("Row 1, A")

    await userEvent.hover(cell)
    const selectTable = await canvas.findByRole("button", {
      name: "Select entire table",
    })
    await userEvent.click(selectTable)

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("button", { name: "Select entire table" }),
      ).not.toBeInTheDocument()
    })

    const cells = canvasElement.querySelectorAll("td, th")
    await expect(cells.length).toBe(6)
    for (const selected of cells) {
      await expect(selected.classList.contains("selectedCell")).toBe(true)
    }
  },
}
