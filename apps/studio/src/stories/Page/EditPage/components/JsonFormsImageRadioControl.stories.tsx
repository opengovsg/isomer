import type { Meta, StoryObj } from "@storybook/nextjs"
import {
  CALLOUT_VARIANT_OPTIONS,
  DEFAULT_CALLOUT_VARIANT,
  DEFAULT_TAG_CATEGORY_DISPLAY,
  IMAGE_RADIO_1COL_FORMAT,
  IMAGE_RADIO_2COL_FORMAT,
  TAG_CATEGORY_DISPLAY_OPTIONS,
  type CalloutVariant,
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
    format: IMAGE_RADIO_2COL_FORMAT,
    default: DEFAULT_TAG_CATEGORY_DISPLAY,
  }),
})

const oneColumnSchema = Type.Object({
  variant: Type.Unsafe<CalloutVariant>({
    oneOf: [
      {
        const: CALLOUT_VARIANT_OPTIONS.Information,
        image: "callout/information",
      },
      {
        const: CALLOUT_VARIANT_OPTIONS.GoodToKnow,
        image: "callout/goodToKnow",
      },
      {
        const: CALLOUT_VARIANT_OPTIONS.Warning,
        image: "callout/warning",
      },
      {
        const: CALLOUT_VARIANT_OPTIONS.Urgent,
        image: "callout/urgent",
      },
      {
        const: CALLOUT_VARIANT_OPTIONS.Note,
        image: "callout/note",
      },
    ],
    title: "Message type",
    format: IMAGE_RADIO_1COL_FORMAT,
    default: DEFAULT_CALLOUT_VARIANT,
  }),
})

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
    data: { variant: CALLOUT_VARIANT_OPTIONS.Warning },
  },
}
