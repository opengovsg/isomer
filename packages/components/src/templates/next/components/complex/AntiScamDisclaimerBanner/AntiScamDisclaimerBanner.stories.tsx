import type { Meta, StoryObj } from "@storybook/react-vite"

import { withChromaticModes } from "@isomer/storybook-config"

import { AntiScamDisclaimerBanner } from "./AntiScamDisclaimerBanner"

const meta: Meta<typeof AntiScamDisclaimerBanner> = {
  title: "Next/Components/AntiScamDisclaimerBanner",
  component: AntiScamDisclaimerBanner,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
  },
  args: {
    type: "antiscamdisclaimerbanner",
  },
}

export default meta
type Story = StoryObj<typeof AntiScamDisclaimerBanner>

export const Default: Story = {}
