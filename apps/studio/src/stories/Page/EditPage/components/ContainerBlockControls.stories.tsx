import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { expect, userEvent, within } from "storybook/test"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"

import { FormBuilder } from "./formBuilder"

const accordionSchema = getComponentSchema({ component: "accordion" })

const homepageColumnSchema = getComponentSchema({
  component: "column",
  layout: "homepage",
})

const contentColumnSchema = getComponentSchema({
  component: "column",
  layout: "content",
})

const text = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Singapore-registered companies, societies and charities can apply.",
        },
      ],
    },
  ],
}

const image = {
  type: "image",
  src: "/placeholder_no_image.png",
  alt: "Flowchart of the eligibility criteria",
}

const callToAction = {
  type: "infobar",
  title: "Ready to apply?",
  buttonLabel: "Start your application",
  buttonUrl: "https://www.google.com",
}

// The nested drawers are absolutely positioned against the drawer, so the
// frame reproduces the editing drawer's size and positioning.
function ContainerBlockFrame({
  schema,
  data,
}: {
  schema: typeof accordionSchema
  data: unknown
}) {
  return (
    <Box position="relative" w="30rem" h="52rem" bg="white" overflow="hidden">
      <ErrorProvider>
        <Box px="1.5rem" py="1rem" h="100%" overflow="auto">
          <FormBuilder schema={schema} data={data} />
        </Box>
      </ErrorProvider>
    </Box>
  )
}

const meta: Meta<typeof ContainerBlockFrame> = {
  title: "Pages/Edit Page/components/ContainerBlockControls",
  component: ContainerBlockFrame,
}

export default meta
type Story = StoryObj<typeof ContainerBlockFrame>

export const EmptyAccordion: Story = {
  args: {
    schema: accordionSchema,
    data: {
      type: "accordion",
      summary: "Who is eligible to apply?",
      content: [],
    },
  },
}

export const AccordionWithBlocks: Story = {
  args: {
    schema: accordionSchema,
    data: {
      type: "accordion",
      summary: "Who is eligible to apply?",
      content: [
        text,
        {
          type: "column",
          variant: "oneThirdTwoThirds",
          columns: [[image], [text]],
        },
        callToAction,
      ],
    },
  },
}

export const AccordionAddBlockPicker: Story = {
  args: AccordionWithBlocks.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: "Add block" }),
    )
    await expect(await canvas.findByText("Choose a block to add")).toBeVisible()
  },
}

export const AccordionColumnExpanded: Story = {
  args: AccordionWithBlocks.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByText(/⅓ \/ ⅔ · Image, Text/))
    await expect(await canvas.findByText("Layout")).toBeVisible()
  },
}

// Opens the Text block: the Call-to-Action's link control needs the page
// editor's route params, which this harness does not provide.
export const AccordionNestedDrawer: Story = {
  args: AccordionWithBlocks.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByText(/Singapore-registered companies/),
    )
    await expect(
      await canvas.findByRole("dialog", { name: "Edit Text" }),
    ).toBeVisible()
  },
}

export const HomepageColumn: Story = {
  args: {
    schema: homepageColumnSchema,
    data: {
      type: "column",
      variant: "threeEqual",
      columns: [[image], [text], []],
    },
  },
}

export const ContentPageColumn: Story = {
  args: {
    schema: contentColumnSchema,
    data: {
      type: "column",
      variant: "twoEqual",
      columns: [[], []],
    },
  },
}
