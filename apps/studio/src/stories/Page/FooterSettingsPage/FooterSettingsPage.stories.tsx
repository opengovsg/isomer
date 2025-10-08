import type { Meta, StoryObj } from "@storybook/react"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import FooterSettingsPage from "~/pages/sites/[siteId]/settings/footer"

const COMMON_HANDLERS = [
  meHandlers.me(),
  sitesHandlers.getSiteName.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  resourceHandlers.getRolesFor.admin(),
  resourceHandlers.search.initial(),
  pageHandlers.getRootPage.default(),
  pageHandlers.readPageAndBlob.homepage(),
]

const meta: Meta<typeof FooterSettingsPage> = {
  title: "Pages/Site Management/Footer Settings Page",
  component: FooterSettingsPage,
  parameters: {
    getLayout: FooterSettingsPage.getLayout,
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [...COMMON_HANDLERS],
    },
  },
}
