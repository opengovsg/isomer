import type { Meta, StoryObj } from "@storybook/react"
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
