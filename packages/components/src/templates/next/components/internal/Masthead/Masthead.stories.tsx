import type { StoryFn, Meta } from "@storybook/react"
import Masthead from "./Masthead"
import type { MastheadProps } from "~/interfaces"

export default {
  title: "Next/Internal Components/Masthead",
  component: Masthead,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
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
