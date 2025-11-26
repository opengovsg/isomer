import type { Meta, StoryObj } from "@storybook/nextjs"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"

import AgencySettingsPage from "~/pages/sites/[siteId]/settings/agency"
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

const meta: Meta<typeof AgencySettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Agency",
  component: AgencySettingsPage,
  parameters: {
    getLayout: AgencySettingsPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        asPath: "/sites/1/settings/agency",
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
