import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import SitePage from "~/pages/sites/[siteId]"

const meta: Meta<typeof SitePage> = {
  title: "Pages/Profile Management/Profile Modal",
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

const ExpandedProfileDropdown: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const testUserSelector = await screen.findByText(/TU/i)
    const testUserSelectorButton = testUserSelector.closest("button")
    if (testUserSelectorButton) {
      await userEvent.click(testUserSelectorButton)
    }
  },
}

export const Default: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await ExpandedProfileDropdown.play?.(context)
    const screen = within(canvasElement)
    const editProfileButton = await screen.findByText("Edit profile")
    await userEvent.click(editProfileButton, {
      pointerEventsCheck: 0,
    })
  },
}
