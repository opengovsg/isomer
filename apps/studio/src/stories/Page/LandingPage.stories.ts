import type { Meta, StoryObj } from "@storybook/react"
import { sitesHandlers } from "tests/msw/handlers/sites"

import DashboardPage from "~/pages/index"

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard",
  component: DashboardPage,
}

export default meta
type Story = StoryObj<typeof DashboardPage>

export const Dashboard: Story = {
  parameters: {
    msw: {
      handlers: [sitesHandlers.list.default()],
    },
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [sitesHandlers.list.loading()],
    },
  },
}

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [sitesHandlers.list.empty()],
    },
  },
}
