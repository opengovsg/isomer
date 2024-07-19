import type { Meta, StoryObj } from "@storybook/react"
import { meHandlers } from "tests/msw/handlers/me"
import { sitesHandlers } from "tests/msw/handlers/sites"

import DashboardPage from "~/pages/dashboard"

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard Page",
  component: DashboardPage,
  parameters: {
    getLayout: DashboardPage.getLayout,
    mockdate: new Date("2023-06-28T07:23:18.349Z"),
    msw: {
      handlers: [meHandlers.me(), sitesHandlers.list.default()],
    },
  },
}

export default meta
type Story = StoryObj<typeof DashboardPage>

export const Default: Story = {
  name: "Dashboard Page",
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [meHandlers.me(), sitesHandlers.list.loading()],
    },
  },
}
