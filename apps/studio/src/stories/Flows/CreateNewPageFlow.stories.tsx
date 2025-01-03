import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import SitePage from "~/pages/sites/[siteId]"

const meta: Meta<typeof SitePage> = {
  title: "Flows/Create New Page",
  component: SitePage,
  parameters: {
    getLayout: SitePage.getLayout,
    msw: {
      handlers: [
        meHandlers.me(),
        pageHandlers.getRootPage.default(),
        pageHandlers.listWithoutRoot.default(),
        sitesHandlers.getConfig.default(),
        sitesHandlers.getTheme.default(),
        sitesHandlers.getFooter.default(),
        sitesHandlers.getNavbar.default(),
        sitesHandlers.getSiteName.default(),
        sitesHandlers.getLocalisedSitemap.default(),
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

export const SelectPageLayout: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)
    const screen = within(canvasElement)

    const button = await screen.findByRole("button", {
      name: "Create new...",
    })
    await userEvent.click(button)

    const menuItem = await rootScreen.findByRole("menuitem", {
      name: /page/i,
    })
    await userEvent.click(menuItem)
  },
}

export const EnterPageDetails: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const screen = within(canvasElement.ownerDocument.body)
    await SelectPageLayout.play?.(context)

    const button = await screen.findByRole("button", {
      name: /next: page title and url/i,
    })
    await userEvent.click(button)

    const input = await screen.findByLabelText(/page title/i)
    await userEvent.type(input, "My_new page WITH w@eird characters!")
  },
}
