import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import CollectionListPage from "~/pages/sites/[siteId]/collections/[resourceId]"

const meta: Meta<typeof CollectionListPage> = {
  title: "Flows/Create Collection Item",
  component: CollectionListPage,
  parameters: {
    getLayout: CollectionListPage.getLayout,
    msw: {
      handlers: [
        meHandlers.me(),
        pageHandlers.listWithoutRoot.default(),
        pageHandlers.getRootPage.default(),
        pageHandlers.countWithoutRoot.default(),
        sitesHandlers.getLocalisedSitemap.default(),
        sitesHandlers.getTheme.default(),
        sitesHandlers.getConfig.default(),
        sitesHandlers.getFooter.default(),
        sitesHandlers.getNavbar.default(),
        sitesHandlers.getLocalisedSitemap.default(),
        sitesHandlers.getSiteName.default(),
        resourceHandlers.getRolesFor.default(),
        resourceHandlers.getChildrenOf.default(),
        resourceHandlers.getMetadataById.article(),
        resourceHandlers.getParentOf.collection(),
        collectionHandlers.getMetadata.default(),
        collectionHandlers.readCollectionLink.default(),
        pageHandlers.readPageAndBlob.article(),
        pageHandlers.readPage.article(),
        pageHandlers.getFullPermalink.article(),
      ],
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          resourceId: "1",
        },
        pathname: "/sites/[siteId]/collections/[resourceId]",
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const SelectLayout: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const button = await screen.findByRole("button", {
      name: "Add new item",
    })
    await userEvent.click(button)
  },
}

export const EnterPageDetails: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const screen = within(canvasElement.ownerDocument.body)
    await SelectLayout.play?.(context)

    await userEvent.click(
      screen.getByRole("button", { name: /next: page details/i }),
    )

    await userEvent.type(
      screen.getByLabelText(/page title/i),
      "My_new page WITH w@eird characters!",
    )
  },
}
