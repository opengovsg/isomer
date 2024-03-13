import type { Meta, StoryFn } from "@storybook/react"
import SidePane from "./SidePane"
import Sitemap from "../../../../sitemap.json"
import type { SidePaneProps } from "~/common"

export default {
  title: "Classic/Components/SidePane",
  component: SidePane,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<SidePaneProps> = (args) => <SidePane {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  currentPermalink: "/about-isomer/what-is-isomer/overview/",
  sitemap: Sitemap,
}
