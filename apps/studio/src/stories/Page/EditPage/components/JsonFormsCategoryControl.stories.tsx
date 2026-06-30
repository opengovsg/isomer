import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"
import { pageHandlers } from "tests/msw/handlers/page"
import {
  JsonFormsCategoryControl,
  jsonFormsCategoryControlTester,
} from "~/features/editing-experience/components/form-builder/renderers/controls/JsonFormsCategoryControl"
import {
  createCategoryIdDropdownGbParameters,
  createDropdownGbParameters,
} from "~/stories/utils/growthbook"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsCategoryControl",
  component: FormBuilder,
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getCategories.default(),
        pageHandlers.getCategoryOptions.default(),
      ],
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          pageId: "1",
        },
        pathname: "/sites/[siteId]/pages/[pageId]",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof JsonFormsCategoryControl>

const schema = Type.Object({
  category: Type.String({
    title: "Article category",
    format: "category",
    description:
      "The category is used for filtering in the parent collection page",
  }),
})

/** CATEGORY_ID_DROPDOWN_FEATURE_KEY flag is off for this site — legacy free-text field is visible. */
export const FlagOff: Story = {
  args: {
    schema,
    renderers: [
      {
        tester: jsonFormsCategoryControlTester,
        renderer: JsonFormsCategoryControl,
      },
    ],
  },
}

/** CATEGORY_ID_DROPDOWN_FEATURE_KEY flag is on for this site — component renders nothing. */
export const FlagOn: Story = {
  parameters: {
    growthbook: [createCategoryIdDropdownGbParameters("1")],
  },
  args: {
    schema,
    renderers: [
      {
        tester: jsonFormsCategoryControlTester,
        renderer: JsonFormsCategoryControl,
      },
    ],
  },
}

export const Dropdown: Story = {
  parameters: {
    growthbook: [createDropdownGbParameters("1")],
    msw: {
      handlers: [
        pageHandlers.getCategories.default(),
        pageHandlers.getCategoryOptions.default(),
      ],
    },
  },
  args: {
    schema,
    renderers: [
      {
        tester: jsonFormsCategoryControlTester,
        renderer: JsonFormsCategoryControl,
      },
    ],
  },
}
