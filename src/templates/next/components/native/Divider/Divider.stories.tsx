import type { Meta, StoryFn } from "@storybook/react"
import type { DividerProps } from "~/interfaces"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "./Divider"

export default {
  title: "Next/Components/Divider",
  component: Divider,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<DividerProps> = (args) => (
  <>
    <BaseParagraph content="This paragraph appears before the divider." />
    <Divider {...args} />
    <BaseParagraph content="This will appear after the divider." />
  </>
)

export const Default = Template.bind({})
Default.args = {}
