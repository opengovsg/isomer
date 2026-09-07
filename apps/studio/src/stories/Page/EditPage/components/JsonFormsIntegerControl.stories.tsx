import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  component: FormBuilder,
  title: "Pages/Edit Page/components/JsonFormsIntegerControl",
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const schema = Type.Object({
  count: Type.Integer({
    default: 0,
    description: "The number of items to display",
    maximum: 10,
    minimum: -10,
    title: "Count",
  }),
})

export const Default: Story = {
  args: {
    data: {},
    schema,
  },
}
