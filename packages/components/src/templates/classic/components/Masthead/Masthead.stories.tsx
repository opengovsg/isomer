import type { Meta, StoryObj } from "@storybook/react-vite"

import type { MastheadProps } from "~/interfaces"
import Masthead from "./Masthead"

const meta: Meta<MastheadProps> = {
  title: "Classic/Components/Masthead",
  component: Masthead,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof Masthead>

// Default scenario
export const Default: Story = {
  args: {
    isStaging: false,
  },
}

export const Staging: Story = {
  args: {
    isStaging: true,
  },
}
