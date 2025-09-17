import type { Meta, StoryObj } from "@storybook/react"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"

import NotificationsSettingsPage from "~/pages/sites/[siteId]/settings/notification"
import { ADMIN_HANDLERS } from "~/stories/handlers"

const COMMON_HANDLERS = [
  ...ADMIN_HANDLERS,
  sitesHandlers.getNotification.default(),
  sitesHandlers.getTheme.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.readPageAndBlob.homepage(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
]

const meta: Meta<typeof NotificationsSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Notification",
  component: NotificationsSettingsPage,
  parameters: {
    getLayout: NotificationsSettingsPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        asPath: "/sites/1/settings/notification",
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
      handlers: [sitesHandlers.getNotification.empty(), ...COMMON_HANDLERS],
    },
  },
}

export const Long: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [sitesHandlers.getNotification.long(), ...COMMON_HANDLERS],
    },
  },
}
