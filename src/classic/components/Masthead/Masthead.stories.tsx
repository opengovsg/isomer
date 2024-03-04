import type { StoryFn, Meta } from "@storybook/react"
import Masthead from "./Masthead"
import { MastheadProps } from "~/common"

export default {
  title: "Classic/Components/Masthead",
  component: Masthead,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<MastheadProps> = (args) => <Masthead {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  isStaging: false,
}

export const Staging = Template.bind({})
Staging.args = {
  isStaging: true,
}
