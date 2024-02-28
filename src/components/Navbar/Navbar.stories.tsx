import { Story, Meta } from "@storybook/react"
import Navbar, { IsomerNavProps } from "./Navbar"
import { Navbar as NavbarConfig } from "~/config/navbar"

export default {
  title: "Components/Navbar",
  component: Navbar,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<IsomerNavProps> = (args) => <Navbar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = NavbarConfig
