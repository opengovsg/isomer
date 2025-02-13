import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import UnsupportedBrowserBanner from "./UnsupportedBrowserBanner"

const meta: Meta = {
  title: "Next/Internal Components/UnsupportedBrowserBanner",
  component: UnsupportedBrowserBanner,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: withChromaticModes(["desktop", "tablet", "mobile"]),
  },
}
export default meta
type Story = StoryObj

// should not show anything
export const Default: Story = {}

// should not show anything
export const Supported: Story = {
  args: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  },
}

// should not show banner
export const SupportedEmptyUserAgent: Story = {
  args: {
    userAgent: "",
  },
}

// should show banner
export const Unsupported: Story = {
  args: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.3",
  },
}
