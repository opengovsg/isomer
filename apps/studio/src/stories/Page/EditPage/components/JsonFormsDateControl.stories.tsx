import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  component: FormBuilder,
  title: "Pages/Edit Page/components/JsonFormsDateControl",
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const schema = Type.Object({
  publishDate: Type.String({
    description: "The date this page should be published",
    format: "date",
    title: "Publish date",
  }),
})

export const Default: Story = {
  args: {
    data: {
      publishDate: "2026-06-13",
    },
    schema,
  },
}

export const Disabled: Story = {
  args: {
    data: {
      publishDate: "2026-06-13",
    },
    readonly: true,
    schema,
  },
}
