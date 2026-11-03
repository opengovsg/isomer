import type { Meta, StoryObj } from "@storybook/react-vite"

import { withArgosModes } from "@isomer/storybook-config"

import { AntiScamDisclaimerBanner } from "./AntiScamDisclaimerBanner"

const meta: Meta<typeof AntiScamDisclaimerBanner> = {
  title: "Next/Components/AntiScamDisclaimerBanner",
  component: AntiScamDisclaimerBanner,
  parameters: {
    layout: "fullscreen",
    argos: withArgosModes(["mobile", "tablet", "desktop"]),
  },
  args: {
    type: "antiscambanner",
  },
}

export default meta
type Story = StoryObj<typeof AntiScamDisclaimerBanner>

export const Default: Story = {}
