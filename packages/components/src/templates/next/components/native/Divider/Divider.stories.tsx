import type { Meta, StoryObj } from "@storybook/react-vite"

import type { DividerProps } from "~/interfaces"
import Divider from "./Divider"

// Template for stories
const Template = (props: DividerProps) => (
  <>
    <p>This paragraph appears before the divider.</p>
    <Divider {...props} />
    <p>This will appear after the divider.</p>
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
