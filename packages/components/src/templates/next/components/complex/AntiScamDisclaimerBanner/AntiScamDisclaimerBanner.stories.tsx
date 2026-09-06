import type { Meta, StoryObj } from "@storybook/react-vite"

import { withChromaticModes } from "@isomer/storybook-config"

import { AntiScamDisclaimerBanner } from "./AntiScamDisclaimerBanner"

const meta: Meta<typeof AntiScamDisclaimerBanner> = {
  args: {
    type: "antiscambanner",
  },
  component: AntiScamDisclaimerBanner,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
  },
  title: "Next/Components/AntiScamDisclaimerBanner",
}

export default meta
type Story = StoryObj<typeof AntiScamDisclaimerBanner>

export const Default: Story = {}
