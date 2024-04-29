import { Meta, StoryFn } from "@storybook/react"
import Callout from "./Callout"
import type { CalloutProps } from "~/interfaces"

export default {
  title: "Next/Components/Callout",
  component: Callout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<CalloutProps> = (args) => <Callout {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  content: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
}
