import type { Meta, StoryObj } from "@storybook/react"

import type { DividerProps } from "~/interfaces"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "./Divider"

// Template for stories
const Template = (props: DividerProps) => (
  <>
    <BaseParagraph content="This paragraph appears before the divider." />
    <Divider {...props} />
    <BaseParagraph content="This will appear after the divider." />
  </>
)

const meta: Meta<DividerProps> = {
  title: "Next/Components/Divider",
  component: Divider,
  render: Template,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Divider>

export const Default: Story = {}
