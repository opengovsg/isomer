import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"

import type { MastheadProps } from "~/interfaces"
import Masthead from "./Masthead"

const meta: Meta<MastheadProps> = {
  title: "Next/Internal Components/Masthead",
  component: Masthead,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
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

export const expanded: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(
      screen.getByRole("button", { name: /how to identify/i }),
    )
  },
}
