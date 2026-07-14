import type { Meta, StoryObj } from "@storybook/nextjs"
import type { JSONContent } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { useRef, useState } from "react"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { TiptapProseEditor } from "~/features/editing-experience/components/form-builder/renderers/TipTapEditor"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

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

const SINGLE_TABLE_EMPTY_CAPTION: JSONContent = {
  type: "prose",
  content: [tableContent("")],
}

const SINGLE_TABLE_WITH_CAPTION: JSONContent = {
  type: "prose",
  content: [tableContent("Figure 1: Quarterly revenue by department")],
}

const TWO_TABLES: JSONContent = {
  type: "prose",
  content: [
    tableContent("First table — quarterly revenue"),
    {
      type: "paragraph",
      content: [{ type: "text", text: "Some text between the two tables." }],
    },
    tableContent(""),
  ],
}

/**
 * Mounts a real TipTap editor (via `useTextEditor`) seeded with `initialContent`,
 * rendering the actual `TiptapProseEditor` alongside `TableCaption` — proving
 * captions are driven by the real editor state/table attributes, not a mock.
 */
const TableCaptionHarness = ({
  initialContent,
}: {
  initialContent: JSONContent
}) => {
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const editor = useTextEditor({ data: content, handleChange: setContent })

  return (
    <Box p="3rem" maxW="48rem" mx="auto">
      <Box ref={containerRef} position="relative">
        <TableCaption editor={editor} containerRef={containerRef} />
        <TiptapProseEditor editor={editor} />
      </Box>
    </Box>
  )
}

const meta: Meta<typeof TableCaptionHarness> = {
  title: "Features/EditingExperience/TableCaption",
  component: TableCaptionHarness,
}

export default meta
type Story = StoryObj<typeof TableCaptionHarness>

export const EmptyCaption: Story = {
  args: { initialContent: SINGLE_TABLE_EMPTY_CAPTION },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText("Add a caption..."),
    ).toBeInTheDocument()
  },
}

export const PopulatedCaption: Story = {
  args: { initialContent: SINGLE_TABLE_WITH_CAPTION },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText("Figure 1: Quarterly revenue by department"),
    ).toBeInTheDocument()
  },
}

/**
 * Two tables in one document — proves the multi-table targeting fix: each
 * table gets its own caption, reflecting its own `caption` attribute, and
 * editing one does not affect the other.
 */
export const TwoTables: Story = {
  args: { initialContent: TWO_TABLES },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await canvas.findByText("First table — quarterly revenue"),
    ).toBeInTheDocument()
    await expect(
      await canvas.findByText("Add a caption..."),
    ).toBeInTheDocument()

    // Editing the second (empty) table's caption must not touch the first.
    const placeholder = await canvas.findByText("Add a caption...")
    await userEvent.click(placeholder)
    const textarea = await canvas.findByPlaceholderText("Add a caption...")
    await userEvent.type(textarea, "Second table caption")
    await userEvent.tab()

    await waitFor(async () => {
      await expect(canvas.getByText("Second table caption")).toBeInTheDocument()
      await expect(
        canvas.getByText("First table — quarterly revenue"),
      ).toBeInTheDocument()
    })
  },
}
