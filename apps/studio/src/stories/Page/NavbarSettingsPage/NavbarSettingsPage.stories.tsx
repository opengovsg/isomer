import type { Meta, StoryObj } from "@storybook/nextjs"
import { userEvent, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import NavbarSettingsPage from "~/pages/sites/[siteId]/settings/navbar"

const BASE_HANDLERS = [
  meHandlers.me(),
  sitesHandlers.getSiteName.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
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
      handlers: [...BASE_HANDLERS, sitesHandlers.getNavbar.default()],
    },
  },
}

// Shows the Customise tab with BoxedGroupControls (CTA and utility toggles off)
export const CustomiseTab: Story = {
  parameters: {
    msw: {
      handlers: [...BASE_HANDLERS, sitesHandlers.getNavbar.default()],
    },
  },
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)

    const customiseTab = await rootScreen.findByRole("tab", {
      name: /customise/i,
    })

    await userEvent.click(customiseTab)
  },
}

// Shows the Customise tab with the CTA BoxedGroupControl toggled on and isPinnedOnMobile enabled
export const CustomiseTabWithCTAEnabled: Story = {
  parameters: {
    msw: {
      handlers: [...BASE_HANDLERS, sitesHandlers.getNavbar.withCTA()],
    },
  },
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)

    const customiseTab = await rootScreen.findByRole("tab", {
      name: /customise/i,
    })

    await userEvent.click(customiseTab)
  },
}
