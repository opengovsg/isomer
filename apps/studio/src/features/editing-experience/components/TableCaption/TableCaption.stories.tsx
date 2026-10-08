import type { Meta, StoryObj } from "@storybook/nextjs"
import type { JSONContent } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { useState } from "react"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { TiptapProseEditor } from "~/features/editing-experience/components/form-builder/renderers/TipTapEditor"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

import { DEFAULT_TABLE_CAPTION } from "./utils"

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

const SINGLE_TABLE_PLACEHOLDER_CAPTION: JSONContent = {
  type: "prose",
  content: [tableContent(DEFAULT_TABLE_CAPTION)],
}

const SINGLE_TABLE_WITH_CAPTION: JSONContent = {
  type: "prose",
  content: [tableContent("Figure 1: Quarterly revenue by department")],
}

const TableCaptionHarness = ({
  initialContent,
}: {
  initialContent: JSONContent
}) => {
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  )
  const editor = useTextEditor({ data: content, handleChange: setContent })

  return (
    <Box p="3rem" maxW="48rem" mx="auto">
      <TiptapProseEditor editor={editor} />
    </Box>
  )
}

const meta: Meta<typeof TableCaptionHarness> = {
  title: "Features/EditingExperience/TableCaption",
  component: TableCaptionHarness,
}

export default meta
type Story = StoryObj<typeof TableCaptionHarness>

export const PlaceholderCaption: Story = {
  args: { initialContent: SINGLE_TABLE_PLACEHOLDER_CAPTION },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await canvas.findByText(DEFAULT_TABLE_CAPTION),
    ).toBeInTheDocument()
    await expect(
      await canvas.findByRole("button", { name: "Add table caption" }),
    ).toHaveTextContent("Add caption")
    await expect(
      await canvas.findByRole("button", { name: "Expand table" }),
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
    await expect(
      await canvas.findByRole("button", { name: "Edit table caption" }),
    ).toHaveTextContent("Edit caption")
    await expect(
      await canvas.findByRole("button", { name: "Expand table" }),
    ).toBeInTheDocument()
  },
}

export const EditCaptionViaModal: Story = {
  args: { initialContent: SINGLE_TABLE_PLACEHOLDER_CAPTION },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await userEvent.click(
      await canvas.findByRole("button", { name: "Add table caption" }),
    )

    const textarea = await body.findByPlaceholderText(
      "This is the caption for your table",
    )
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Revenue breakdown by quarter")
    await userEvent.click(body.getByRole("button", { name: "Save changes" }))

    await waitFor(async () => {
      await expect(body.queryByText("Table settings")).not.toBeInTheDocument()
    })
    await expect(
      await canvas.findByText("Revenue breakdown by quarter"),
    ).toBeInTheDocument()
    await expect(
      await canvas.findByRole("button", { name: "Edit table caption" }),
    ).toBeInTheDocument()
  },
}

const EMPTY_TABLE: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "" },
      content: [
        {
          type: "tableRow",
          content: ["", ""].map(() => ({
            type: "tableHeader",
            content: [{ type: "paragraph" }],
          })),
        },
        {
          type: "tableRow",
          content: ["", ""].map(() => ({
            type: "tableCell",
            content: [{ type: "paragraph" }],
          })),
        },
      ],
    },
  ],
}

const expectTableEditingControls = async (dialog: HTMLElement) => {
  const modal = within(dialog)
  await expect(
    modal.getByRole("button", { name: /^superscript$/i }),
  ).toBeInTheDocument()
  await expect(
    modal.getByRole("button", { name: /^subscript$/i }),
  ).toBeInTheDocument()
  await expect(
    modal.queryByRole("button", { name: /^text styles$/i }),
  ).not.toBeInTheDocument()
  await expect(
    modal.queryByRole("button", { name: /^more options$/i }),
  ).not.toBeInTheDocument()
  await expect(
    modal.queryByRole("button", { name: /^table$/i }),
  ).not.toBeInTheDocument()
  await expect(
    modal.queryByRole("button", { name: "Expand table" }),
  ).not.toBeInTheDocument()
}

export const EditEmptyTable: Story = {
  args: { initialContent: EMPTY_TABLE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await userEvent.click(
      await canvas.findByRole("button", { name: "Expand table" }),
    )

    const dialog = await body.findByRole("dialog", { name: "Edit table" })
    await expectTableEditingControls(dialog)
  },
}

export const EditPopulatedTable: Story = {
  args: { initialContent: SINGLE_TABLE_WITH_CAPTION },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await userEvent.click(
      await canvas.findByRole("button", { name: "Expand table" }),
    )

    const dialog = await body.findByRole("dialog", { name: "Edit table" })
    await expect(
      await within(dialog).findByText(
        "Figure 1: Quarterly revenue by department",
      ),
    ).toBeInTheDocument()
    await expect(within(dialog).getByText("Column A")).toBeInTheDocument()
    await expectTableEditingControls(dialog)
  },
}
