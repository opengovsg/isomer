import type { Meta, StoryObj } from "@storybook/react"

import { DynamicStatisticsUI } from "./DynamicStatistics"

const meta: Meta<typeof DynamicStatisticsUI> = {
  title: "Next/Components/DynamicStatistics",
  component: DynamicStatisticsUI,
}

export default meta
type Story = StoryObj<typeof DynamicStatisticsUI>

export const Default: Story = {
  args: {
    title: "1 Rejab 1446H",
    statistics: [
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
