import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  component: FormBuilder,
  title: "Pages/Edit Page/components/JsonFormsTextAreaControl",
}

export default meta
type Story = StoryObj<typeof FormBuilder>

export const Default: Story = {
  args: {
    data: {},
    schema: Type.Object({
      description: Type.Optional(
        Type.String({
          title: "Meta description",
          description:
            "This is a description that appears on search engine results.",
          format: "textarea",
        }),
      ),
    }),
  },
}

export const MaxLength: Story = {
  args: {
    data: { quote: "A short quote." },
    schema: Type.Object({
      quote: Type.String({
        title: "Quote",
        maxLength: 280,
        format: "textarea",
      }),
    }),
  },
}
