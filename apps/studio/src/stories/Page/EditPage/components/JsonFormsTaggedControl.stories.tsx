import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"
import { pageHandlers } from "tests/msw/handlers/page"

import {
  JsonFormsTaggedControl,
  jsonFormsTaggedControlTester,
} from "~/features/editing-experience/components/form-builder/renderers/controls/JsonFormsTaggedControl"
import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  title: "Pages/Edit Page/components/JsonFormsTaggedControl",
  component: FormBuilder,
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getCategories.default(),
        pageHandlers.getCollectionTags.default(),
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
type Story = StoryObj<typeof JsonFormsTaggedControl>

const schema = Type.Object({
  tagged: Type.Array(Type.String(), {
    title: "Article tags",
    format: "tagged",
    description:
      "Tags are used for filtering and categorizing content in the collection",
  }),
})

export const Default: Story = {
  args: {
    schema,
    renderers: [
      {
        tester: jsonFormsTaggedControlTester,
        renderer: JsonFormsTaggedControl,
      },
    ],
  },
}
