import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, waitFor, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import SitePage from "~/pages/sites/[siteId]"

const meta: Meta<typeof SitePage> = {
  title: "Pages/Site Management/Search",
  component: SitePage,
  parameters: {
    getLayout: SitePage.getLayout,
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
        resourceHandlers.getRolesFor.default(),
      ],
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const SearchModal: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const screen = within(canvasElement)
      const searchButton = screen.getByRole("button", {
        name: "search-button",
      })
      await userEvent.click(searchButton)
    })
  },
}
