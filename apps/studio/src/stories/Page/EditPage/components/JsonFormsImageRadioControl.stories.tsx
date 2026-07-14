import type { Meta, StoryObj } from "@storybook/nextjs"
import {
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

const schema = Type.Object({
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
    format: "image-radio",
    default: DEFAULT_TAG_CATEGORY_DISPLAY,
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
    data: { display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext },
  },
}
