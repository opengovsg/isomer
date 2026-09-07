import type { Meta, StoryObj } from "@storybook/nextjs"
import { Type } from "@sinclair/typebox"
import { pageHandlers } from "tests/msw/handlers/page"
import {
  JsonFormsTaggedControl,
  jsonFormsTaggedControlTester,
} from "~/features/editing-experience/components/form-builder/renderers/controls/JsonFormsTaggedControl"

import { FormBuilder } from "./formBuilder"

const meta: Meta<typeof FormBuilder> = {
  component: FormBuilder,
  parameters: {
    msw: {
      handlers: [pageHandlers.getCollectionTags.default()],
    },
    nextjs: {
      router: {
        pathname: "/sites/[siteId]/pages/[pageId]",
        query: {
          pageId: "1",
          siteId: "1",
        },
      },
    },
  },
  title: "Pages/Edit Page/components/JsonFormsTaggedControl",
}

export default meta
type Story = StoryObj<typeof JsonFormsTaggedControl>

const schema = Type.Object({
  tagged: Type.Array(Type.String(), {
    description:
      "Tags are used for filtering and categorizing content in the collection",
    format: "tagged",
    title: "Article tags",
  }),
})

export const Default: Story = {
  args: {
    renderers: [
      {
        tester: jsonFormsTaggedControlTester,
        renderer: JsonFormsTaggedControl,
      },
    ],
    schema,
  },
}

/** No tagCategories groups exist yet on the site — the control renders nothing. */
export const Empty: Story = {
  args: {
    renderers: [
      {
        tester: jsonFormsTaggedControlTester,
        renderer: JsonFormsTaggedControl,
      },
    ],
    schema,
  },
  parameters: {
    msw: {
      handlers: [pageHandlers.getCollectionTags.empty()],
    },
  },
}

export const Populated: Story = {
  args: {
    data: ["6ba7b810-9dad-11d1-80b4-00c04fd430c8"],
    renderers: [
      {
        tester: jsonFormsTaggedControlTester,
        renderer: JsonFormsTaggedControl,
      },
    ],
    schema,
  },
}

export const WithRequiredCategory: Story = {
  args: {
    renderers: [
      {
        tester: jsonFormsTaggedControlTester,
        renderer: JsonFormsTaggedControl,
      },
    ],
    schema,
  },
  parameters: {
    msw: {
      handlers: [pageHandlers.getCollectionTags.withRequired()],
    },
  },
}
