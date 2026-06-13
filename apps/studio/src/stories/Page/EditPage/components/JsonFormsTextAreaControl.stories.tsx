import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsTextAreaControl",
  component: FormBuilder,
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const schema = Type.Object({
  description: Type.Optional(
    Type.String({
      title: "Meta description",
      description:
        "This is a description that appears on search engine results.",
      format: "textarea",
    }),
  ),
})

const maxLengthSchema = Type.Object({
  quote: Type.String({
    title: "Quote",
    maxLength: 280,
    format: "textarea",
  }),
})

export const Default: Story = {
  args: {
    schema,
    data: {},
  },
}

export const MaxLength: Story = {
  args: {
    schema: maxLengthSchema,
    data: { quote: "A short quote." },
  },
}
