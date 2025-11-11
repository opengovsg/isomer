import type { Meta, StoryObj } from "@storybook/nextjs"
import { userEvent, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"

import ColoursSettingsPage from "~/pages/sites/[siteId]/settings/colours"
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

const meta: Meta<typeof ColoursSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Colours",
  component: ColoursSettingsPage,
  parameters: {
    getLayout: ColoursSettingsPage.getLayout,
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

export const ContentPagePreview: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)

    const menuItem = await rootScreen.findByRole("tab", {
      name: /content page/i,
    })

    await userEvent.click(menuItem)
  },
}

export const DarkPalette: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)

    const colourInput = await rootScreen.findByPlaceholderText("FFFFFF")

    await userEvent.clear(colourInput)
    await userEvent.type(colourInput, "#000000")
  },
}

export const LightPalette: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)

    const colourInput = await rootScreen.findByPlaceholderText("FFFFFF")

    await userEvent.clear(colourInput)
    await userEvent.type(colourInput, "FFFFFF")
  },
}

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)

    const colourInput = await rootScreen.findByPlaceholderText("FFFFFF")

    await userEvent.clear(colourInput)
  },
}
