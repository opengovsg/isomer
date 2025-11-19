import type { Meta, StoryObj } from "@storybook/nextjs"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import NavbarSettingsPage from "~/pages/sites/[siteId]/settings/navbar"

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

const meta: Meta<typeof NavbarSettingsPage> = {
  title: "Pages/Site Management/Navbar Settings Page",
  component: NavbarSettingsPage,
  parameters: {
    getLayout: NavbarSettingsPage.getLayout,
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
