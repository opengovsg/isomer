import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { InfoColsSchema } from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsIconPickerControl",
  component: FormBuilder,
  decorators: [
    (Story) => (
      // Mimic the width of the editor sidebar the control is rendered in
      <Box maxW="24rem" p="1.5rem">
        <Story />
      </Box>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FormBuilder>

// Reuse the real InfoCols column icon schema so the story stays in sync with
// the icons supported by the published site renderer
const iconPickerSchema = Type.Pick(InfoColsSchema.properties.infoBoxes.items, [
  "icon",
])

export const Default: Story = {
  args: {
    schema: iconPickerSchema,
    data: {},
  },
}

export const CalendarSelected: Story = {
  args: {
    schema: iconPickerSchema,
    data: { icon: "calendar" },
  },
}

export const ReadOnly: Story = {
  args: {
    schema: iconPickerSchema,
    data: { icon: "map-pin" },
    readonly: true,
  },
}
