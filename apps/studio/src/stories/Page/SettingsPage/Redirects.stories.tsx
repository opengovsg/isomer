import type { Meta, StoryObj } from "@storybook/nextjs"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"
import RedirectsSettingsPage from "~/pages/sites/[siteId]/settings/redirects"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import { createRedirectionsEnabledGbParameters } from "~/stories/utils/growthbook"

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

const COMMON_NEXTJS = {
  router: {
    asPath: "/sites/1/settings/redirects",
    query: {
      siteId: "1",
    },
  },
}

const meta: Meta<typeof RedirectsSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Redirects",
  component: RedirectsSettingsPage,
  parameters: {
    getLayout: RedirectsSettingsPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: COMMON_NEXTJS,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
  },
}
