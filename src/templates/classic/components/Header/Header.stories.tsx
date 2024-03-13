import type { Meta, StoryFn } from "@storybook/react"
import Header from "./Header"
import Sitemap from "../../../../sitemap.json"
import type { HeaderProps } from "~/common"

export default {
  title: "Classic/Components/Header",
  component: Header,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<HeaderProps> = (args) => <Header {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  permalink: "/hello/world",
  sitemap: Sitemap,
}
