import type { Meta, StoryFn } from "@storybook/react"
import type { DividerProps } from "~/interfaces"
import Divider from "./Divider"
import Paragraph from "../Paragraph"

export default {
  title: "Next/Components/Divider",
  component: Divider,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<DividerProps> = (args) => (
  <>
    <Paragraph content="This paragraph appears before the divider." />
    <Divider {...args} />
    <Paragraph content="This will appear after the divider." />
  </>
)

export const Default = Template.bind({})
Default.args = {}
