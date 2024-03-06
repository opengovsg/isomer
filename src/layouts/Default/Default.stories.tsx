import { Story, Meta } from "@storybook/react"
import DefaultLayout, { DefaultLayoutProps } from "./Default"
import { Navbar } from "~/config/navbar"
import { Footer } from "~/config/footer"
import Sitemap from "../../sitemap.json"

export default {
  title: "Layouts/Default",
  component: DefaultLayout,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<DefaultLayoutProps> = (args) => (
  <DefaultLayout {...args} />
)

// Default scenario
export const Default = Template.bind({})
Default.args = {
  navbar: Navbar,
  footer: Footer,
  permalink: "/about-isomer/what-is-isomer/overview/",
  sitemap: Sitemap,
  children: <h1>Hello</h1>,
}
