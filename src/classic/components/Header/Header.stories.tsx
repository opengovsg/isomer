import { Story, Meta } from "@storybook/react"
import Header, { HeaderProps } from "./Header"
import Sitemap from "../../../sitemap.json"

export default {
  title: "Components/Header",
  component: Header,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<HeaderProps> = (args) => <Header {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  permalink: "/hello/world",
  sitemap: Sitemap,
}
