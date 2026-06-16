import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsIntegerControl",
  component: FormBuilder,
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const schema = Type.Object({
  count: Type.Integer({
    title: "Count",
    minimum: -10,
    maximum: 10,
    default: 0,
    description: "The number of items to display",
  }),
})

export const Default: Story = {
  args: {
    schema,
    data: {},
  },
}
