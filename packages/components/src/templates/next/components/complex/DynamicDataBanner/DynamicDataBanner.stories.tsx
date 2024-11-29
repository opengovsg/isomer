import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import { DynamicDataBannerUI } from "./DynamicDataBannerClient"

const meta: Meta<typeof DynamicDataBannerUI> = {
  title: "Next/Components/DynamicDataBanner",
  component: DynamicDataBannerUI,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
  },
}

export default meta
type Story = StoryObj<typeof DynamicDataBannerUI>

export const Default: Story = {
  args: {
    title: "1 Rejab 1446H",
    data: [
      { label: "Subuh", value: "5:43am" },
      { label: "Syuruk", value: "7:07am" },
      { label: "Zohor", value: "1:09pm" },
      { label: "Asar", value: "4.33pm" },
      { label: "Maghrib", value: "7.10pm" },
      { label: "Isyak", value: "8.25pm" },
    ],
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    label: "View all dates",
  },
}
