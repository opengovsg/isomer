import type { Meta, StoryObj } from "@storybook/react"
import { meHandlers } from "tests/msw/handlers/me"

import DashboardPage from "~/pages/dashboard"

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard Page",
  component: DashboardPage,
  parameters: {
    mockdate: new Date("2023-06-28T07:23:18.349Z"),
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: "fullscreen",
    msw: {
      handlers: [meHandlers.me()],
    },
  },
}

export default meta
type Story = StoryObj<typeof DashboardPage>

export const Default: Story = {}
