import type { Meta, StoryObj } from "@storybook/react-vite"
import type { MastheadProps } from "~/interfaces"
import { userEvent, within } from "storybook/test"

import { withChromaticModes } from "@isomer/storybook-config"

import { Masthead } from "./Masthead"

const meta: Meta<MastheadProps> = {
  argTypes: {},
  component: Masthead,
  parameters: {
    chromatic: withChromaticModes(["desktop", "tablet", "mobile"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/Masthead",
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

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    // Trigger is <summary> (disclosure), not a button; click the visible label
    await userEvent.click(screen.getByText("How to identify"))
  },
}
