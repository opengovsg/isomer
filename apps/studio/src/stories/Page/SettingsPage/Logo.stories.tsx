import type { Meta, StoryObj } from "@storybook/nextjs"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"

import LogoSettingsPage from "~/pages/sites/[siteId]/settings/logo"
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

const meta: Meta<typeof LogoSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Logo",
  component: LogoSettingsPage,
  parameters: {
    getLayout: LogoSettingsPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        asPath: "/sites/1/settings/logo",
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

export const WithFavicon: Story = {
  parameters: {
    msw: {
      handlers: [sitesHandlers.getConfig.withFavicon(), ...COMMON_HANDLERS],
    },
  },
}
