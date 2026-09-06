import type { Meta, StoryObj } from "@storybook/react-vite"
import type { KeyStatisticsProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { KeyStatistics } from "./KeyStatistics"

const meta: Meta<KeyStatisticsProps> = {
  argTypes: {},
  args: {
    headingLevel: 2,
    site: generateSiteConfig(),
  },
  component: KeyStatistics,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/KeyStatistics",
}
export default meta
type Story = StoryObj<typeof KeyStatistics>

export const Top: Story = {
  args: {
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "3",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+12.2%" },
      { label: "Creative blocks met per single evening", value: "89" },
      { label: "Number of lies in this stat block", value: "4.0" },
    ],
    title: "Work life in numbers",
  },
}

export const TopLong: Story = {
  args: {
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      { label: "Creative blocks met per single evening", value: "82329" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
    title: "Work life in numbers",
  },
}

export const ThreeStats: Story = {
  args: {
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
    title:
      "A long title that should wrap properly, if the max width of the title is done well",
  },
}

export const WithLink: Story = {
  args: {
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
    title: "Short title",
    url: "/",
  },
}

export const WithLinkAndLabel: Story = {
  args: {
    label: "We have no achievements",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
    title: "Short title",
    url: "/",
  },
}
