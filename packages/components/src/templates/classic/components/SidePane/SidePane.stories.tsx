import type { Meta, StoryObj } from "@storybook/react-vite"

import type { SidePaneProps } from "~/interfaces"
import Sitemap from "../../../../sitemap.json"
import SidePane from "./SidePane"

const meta: Meta<SidePaneProps> = {
  title: "Classic/Components/SidePane",
  component: SidePane,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof SidePane>

// Default scenario
export const Default: Story = {
  args: {
    currentPermalink: "/about-isomer/what-is-isomer/overview/",
    sitemap: Sitemap,
  },
}
