import type { Meta, StoryFn } from "@storybook/react"
import Navbar, { IsomerNavProps, NavbarLink } from "./Navbar"
import { Navbar as NavbarConfig } from "~/config/navbar"

export default {
  title: "Next/Components/Navbar",
  component: Navbar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<IsomerNavProps> = (args) => <Navbar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  id: NavbarConfig.id,
  logo: NavbarConfig.components[0].props.logo,
  links: NavbarConfig.components[0].props.links as NavbarLink[],
  search: NavbarConfig.components[0].props.search,
}
