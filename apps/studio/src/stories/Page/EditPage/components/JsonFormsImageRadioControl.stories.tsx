import type { Meta, StoryObj } from "@storybook/nextjs"
import { CalloutSchema, DEFAULT_TAG_CATEGORY_DISPLAY, TAG_CATEGORY_DISPLAY_OPTIONS } from '@opengovsg/isomer-components';
import type { TagCategoryDisplay } from '@opengovsg/isomer-components';
import { Type } from "@sinclair/typebox"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  component: FormBuilder,
  title: "Pages/Edit Page/components/JsonFormsImageRadioControl",
}

export default meta
type Story = StoryObj<typeof FormBuilder>

const twoColumnSchema = Type.Object({
  display: Type.Unsafe<TagCategoryDisplay>({
    default: DEFAULT_TAG_CATEGORY_DISPLAY,
    format: "image-radio/2col",
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
  }),
})

const oneColumnSchema = Type.Pick(CalloutSchema, ["variant"])

export const TwoColumns: Story = {
  args: {
    data: {},
    schema: twoColumnSchema,
  },
}

export const TwoColumnsPlaintextSelected: Story = {
  args: {
    data: { display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext },
    schema: twoColumnSchema,
  },
}

export const OneColumn: Story = {
  args: {
    data: {},
    schema: oneColumnSchema,
  },
}

export const OneColumnWarningSelected: Story = {
  args: {
    data: { variant: "warning" },
    schema: oneColumnSchema,
  },
}
