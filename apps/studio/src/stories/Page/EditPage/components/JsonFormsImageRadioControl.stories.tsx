import type { Meta, StoryObj } from "@storybook/nextjs"
import {
  CalloutSchema,
  DEFAULT_TAG_CATEGORY_DISPLAY,
  TAG_CATEGORY_DISPLAY_OPTIONS,
  type TagCategoryDisplay,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsImageRadioControl",
  component: FormBuilder,
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const twoColumnSchema = Type.Object({
  display: Type.Unsafe<TagCategoryDisplay>({
    oneOf: [
      {
        const: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        image: "tagcategory/pills",
      },
      {
        const: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        image: "tagcategory/plaintext",
      },
    ],
    title: "Show as",
    format: "image-radio/2col",
    default: DEFAULT_TAG_CATEGORY_DISPLAY,
  }),
})

const oneColumnSchema = Type.Pick(CalloutSchema, ["variant"])

export const TwoColumns: Story = {
  args: {
    schema: twoColumnSchema,
    data: {},
  },
}

export const TwoColumnsPlaintextSelected: Story = {
  args: {
    schema: twoColumnSchema,
    data: { display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext },
  },
}

export const OneColumn: Story = {
  args: {
    schema: oneColumnSchema,
    data: {},
  },
}

export const OneColumnWarningSelected: Story = {
  args: {
    schema: oneColumnSchema,
    data: { variant: "warning" },
  },
}
