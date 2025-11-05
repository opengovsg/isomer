import type { Meta, StoryObj } from "@storybook/nextjs"
import { userEvent, within } from "storybook/test"
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
        pageHandlers.getRootPage.default(),
        pageHandlers.countWithoutRoot.default(),
        pageHandlers.readPage.content(),
        pageHandlers.updateSettings.collection(),
        pageHandlers.getPermalinkTree.withParent(),
        sitesHandlers.getSiteName.default(),
        resourceHandlers.getChildrenOf.default(),
        resourceHandlers.getRolesFor.admin(),
        resourceHandlers.getParentOf.collection(),
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

export const PageResourceMenu: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const pageMenuButton = await screen.findByRole("button", {
      name: "Options for Test page 1",
    })
    await userEvent.click(pageMenuButton)
  },
}

export const LinkResourceMenu: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const linkMenuButton = await screen.findByRole("button", {
      name: "Options for Test link 1",
    })
    await userEvent.click(linkMenuButton)
  },
}

export const WithBanner: Story = {
  parameters: {
    growthbook: [
      createBannerGbParameters({
        variant: "info",
        message:
          "This is a test banner that is very long. This is a test banner that is very long. This is a test banner that is very long. This is a test banner that is very long. This is a test banner that is very long.",
      }),
    ],
  },
}

export const PageSettings: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await PageResourceMenu.play?.(context)
    const screen = within(canvasElement.ownerDocument.body)
    const pageSettingsButton = screen.getByText("Edit settings")

    await userEvent.click(pageSettingsButton, {
      pointerEventsCheck: 0,
    })
  },
}

export const LinkSettings: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await LinkResourceMenu.play?.(context)
    const screen = within(canvasElement.ownerDocument.body)
    const linkSettingsButton = screen.getByText("Edit settings")

    await userEvent.click(linkSettingsButton, {
      pointerEventsCheck: 0,
    })
  },
}

export const ExpandedProfileDropdown: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const testUserSelector = await screen.findByText(/TU/i)
    const testUserSelectorButton = testUserSelector.closest("button")
    if (testUserSelectorButton) {
      await userEvent.click(testUserSelectorButton)
    }
  },
}
