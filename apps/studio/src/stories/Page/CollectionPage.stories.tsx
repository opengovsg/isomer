import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import CollectionPage from "~/pages/sites/[siteId]/collections/[resourceId]"
import { createBannerGbParameters } from "../utils/growthbook"

const meta: Meta<typeof CollectionPage> = {
  title: "Pages/Collection Management/Collection Page",
  component: CollectionPage,
  parameters: {
    getLayout: CollectionPage.getLayout,
    msw: {
      handlers: [
        meHandlers.me(),
        pageHandlers.listWithoutRoot.default(),
        pageHandlers.countWithoutRoot.default(),
        pageHandlers.readPage.content(),
        pageHandlers.updateSettings.collection(),
        pageHandlers.getPermalinkTree.withParent(),
        sitesHandlers.getSiteName.default(),
        resourceHandlers.getChildrenOf.collection(),
        resourceHandlers.getRolesFor.default(),
        collectionHandlers.getMetadata.default(),
        collectionHandlers.list.default(),
      ],
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          resourceId: "1",
        },
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
