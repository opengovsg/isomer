import type { Meta, StoryObj } from "@storybook/nextjs"
import { userEvent, within } from "storybook/test"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import CollectionListPage from "~/pages/sites/[siteId]/collections/[collectionId]"

const meta: Meta<typeof CollectionListPage> = {
  component: CollectionListPage,
  decorators: [],
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
        resourceHandlers.getRolesFor.admin(),
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
        pathname: "/sites/[siteId]/collections/[collectionId]",
        query: {
          collectionId: "1",
          siteId: "1",
        },
      },
    },
  },
  title: "Flows/Create Collection Item",
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
      screen.getByRole("button", { name: /next: page details/iu }),
    )

    await userEvent.type(
      screen.getByLabelText(/page title/iu),
      "My_new page WITH w@eird characters!",
    )
  },
}
