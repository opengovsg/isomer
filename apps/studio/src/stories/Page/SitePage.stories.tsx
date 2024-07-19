import type { Meta, StoryObj } from "@storybook/react"

import SitePage from "~/pages/sites/[siteId]"
import { AdminLayout } from "~/templates/layouts/AdminLayout"

const meta: Meta<typeof SitePage> = {
  title: "pages/site/[siteId]",
  component: SitePage,
  parameters: {
    getLayout: AdminLayout,
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
