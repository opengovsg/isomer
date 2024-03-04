import { Meta, StoryFn } from "@storybook/react"
import Header from "./Header"
import Sitemap from "../../../sitemap.json"
import { HeaderProps } from "~/common"

export default {
  title: "Classic/Components/Header",
  component: Header,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<HeaderProps> = (args) => <Header {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  permalink: "/hello/world",
  sitemap: Sitemap,
}
