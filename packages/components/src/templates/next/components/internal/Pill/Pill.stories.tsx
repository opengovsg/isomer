import type { Meta, StoryObj } from "@storybook/react-vite"

import type { PillProps } from "~/interfaces"
import Pill from "./Pill"

const meta: Meta<PillProps> = {
  title: "Next/Internal Components/Pill",
  component: Pill,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Pill>

export const Default: Story = {
  args: {
    content: "Press Release",
    onClose: () => window.alert("Closed pill"),
  },
}
