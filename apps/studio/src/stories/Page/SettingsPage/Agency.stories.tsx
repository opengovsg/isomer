import type { Meta, StoryObj } from "@storybook/react"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"

import AgencySettingsPage from "~/pages/sites/[siteId]/settings/agency"
import { COMMON_HANDLERS } from "~/stories/handlers"

const meta: Meta<typeof AgencySettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page",
  component: AgencySettingsPage,
  parameters: {
    getLayout: AgencySettingsPage.getLayout,
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        sitesHandlers.getNotification.default(),
        sitesHandlers.getTheme.default(),
        pageHandlers.getRootPage.default(),
        pageHandlers.readPageAndBlob.homepage(),
        sitesHandlers.getLocalisedSitemap.default(),
        sitesHandlers.getConfig.default(),
        sitesHandlers.getFooter.default(),
        sitesHandlers.getNavbar.default(),
      ],
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
