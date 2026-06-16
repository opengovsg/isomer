import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsDateControl",
  component: FormBuilder,
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const schema = Type.Object({
  publishDate: Type.String({
    title: "Publish date",
    format: "date",
    description: "The date this page should be published",
  }),
})

export const Default: Story = {
  args: {
    schema,
    data: {
      publishDate: "2026-06-13",
    },
  },
}

export const Disabled: Story = {
  args: {
    schema,
    data: {
      publishDate: "2026-06-13",
    },
    readonly: true,
  },
}
