import { Story, Meta } from "@storybook/react"
import Infobar, { InfobarProps } from "./Infobar"

export default {
  title: "Isomer/Infobar",
  component: Infobar,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<InfobarProps> = (args) => <Infobar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  title: "Infobar title",
  subtitle: "subtitle",
  description: "About a sentence worth of description here",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
}
