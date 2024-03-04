import { Story, Meta } from "@storybook/react"
import SidePane, { SidePaneProps } from "./SidePane"
import Sitemap from "../../../sitemap.json"
export default {
  title: "Classic/Components/SidePane",
  component: SidePane,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<SidePaneProps> = (args) => <SidePane {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  currentPermalink: "/about-isomer/what-is-isomer/overview/",
  sitemap: Sitemap,
}
