import type { Meta, StoryObj } from "@storybook/react"

import LayoutSelection from "./LayoutSelection"
import { siteHandlers } from "tests/msw/handlers/site"

const meta: Meta<typeof LayoutSelection> = {
  title: "Components/LayoutSelection",
  component: LayoutSelection,
  parameters: {
    msw: {
      handlers: [
        siteHandlers.getConfig(),
        siteHandlers.getFooter(),
        siteHandlers.getNavbar(),
      ],
    },
  },
}
export default meta
type Story = StoryObj<typeof LayoutSelection>

export const Default: Story = {
  args: {
    pageName: "Sample Page",
    pageUrl: "/sample-page",
    siteId: "1",
    folderId: "1",
  },
}
