import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, waitFor, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"

import SitePage from "~/pages/sites/[siteId]"

const meta: Meta<typeof SitePage> = {
  title: "Pages/Site Management/Site Page",
  component: SitePage,
  parameters: {
    getLayout: SitePage.getLayout,
    msw: {
      handlers: [meHandlers.me(), pageHandlers.list.default()],
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
    await waitFor(async () => {
      const screen = within(canvasElement)
      const pageMenuButton = screen.getByRole("button", {
        name: "Options for Test Page 1",
      })
      await userEvent.click(pageMenuButton)
    })
  },
}

export const FolderResourceMenu: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const screen = within(canvasElement)
      const folderMenuButton = screen.getByRole("button", {
        name: "Options for Test Folder 1",
      })
      await userEvent.click(folderMenuButton)
    })
  },
}
