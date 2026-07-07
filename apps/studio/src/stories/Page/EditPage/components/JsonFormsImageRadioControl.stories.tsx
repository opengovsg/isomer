import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsImageRadioControl",
  component: FormBuilder,
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const schema = Type.Object({
  display: Type.Unsafe<"pills" | "plaintext">({
    oneOf: [
      {
        const: "pills",
        image: "tagcategory-pills",
      },
      {
        const: "plaintext",
        image: "tagcategory-plaintext",
      },
    ],
    title: "Show as",
    format: "image-radio",
    default: "pills",
  }),
})

export const Default: Story = {
  args: {
    schema,
    data: {},
  },
}

export const PlaintextSelected: Story = {
  args: {
    schema,
    data: { display: "plaintext" },
  },
}
