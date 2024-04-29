import type { Meta, StoryFn } from "@storybook/react"
import KeyStatistics from "./KeyStatistics"
import type { KeyStatisticsProps } from "~/interfaces"

export default {
  title: "Next/Components/KeyStatistics",
  component: KeyStatistics,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<KeyStatisticsProps> = (args) => (
  <KeyStatistics {...args} />
)

export const Side = Template.bind({})
Side.args = {
  variant: "side",
  title: "Key economic indicators",
  statistics: [
    {
      label: "Advance GDP Estimates, 4Q 2023 (YoY)",
      value: "+2.8%",
    },
    { label: "Total Merchandise Trade, Dec 2023 (YoY)", value: "-6.8%" },
    { label: "Industrial Production, Dec 2023 (YoY)", value: "-2.5%" },
  ],
}

export const Top = Template.bind({})
Top.args = {
  variant: "top",
  title: "Work life in numbers",
  statistics: [
    {
      label: "Average all nighters pulled in a typical calendar month",
      value: "3",
    },
    { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+12.2%" },
    { label: "Creative blocks met per single evening", value: "89" },
    { label: "Number of lies in this stat block", value: "4.0" },
  ],
}
