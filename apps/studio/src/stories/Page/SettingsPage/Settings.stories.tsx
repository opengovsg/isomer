import type { Meta, StoryObj } from "@storybook/react"
import { sitesHandlers } from "tests/msw/handlers/sites"

import SiteSettingsPage from "~/pages/sites/[siteId]/settings"
import { ADMIN_HANDLERS } from "~/stories/handlers"

const meta: Meta<typeof SiteSettingsPage> = {
  title: "Pages/Site Management/Site Settings",
  component: SiteSettingsPage,
  parameters: {
    getLayout: SiteSettingsPage.getLayout,
    msw: {
      handlers: [...ADMIN_HANDLERS, sitesHandlers.getNotification.default()],
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
    decorators: [],
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Disabled: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [sitesHandlers.getNotification.empty(), ...ADMIN_HANDLERS],
    },
  },
}

export const Long: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [sitesHandlers.getNotification.long(), ...ADMIN_HANDLERS],
    },
  },
}
