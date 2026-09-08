import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { DateRangeFilterValue } from "./DateRangeFilterInput"
import { DateRangeFilterInput } from "./DateRangeFilterInput"

const meta: Meta<typeof DateRangeFilterInput> = {
  title: "Next/Internal Components/Filter/DateRangeFilterInput",
  component: DateRangeFilterInput,
  args: {
    legend: "Publication date",
  },
  render: ({ value: initialValue, legend }) => {
    const [value, setValue] = useState<DateRangeFilterValue | undefined>(
      initialValue,
    )
    return (
      <DateRangeFilterInput legend={legend} value={value} onChange={setValue} />
    )
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: withChromaticModes(["mobileSmall", "desktop"]),
  },
}
export default meta
type Story = StoryObj<typeof DateRangeFilterInput>

export const Empty: Story = {
  args: {
    value: undefined,
  },
}

export const WithRangeApplied: Story = {
  args: {
    value: { start: "2026-04-28", end: "2026-05-30" },
  },
}

export const WithFromOnly: Story = {
  args: {
    value: { start: "2026-04-28" },
  },
}

export const WithToOnly: Story = {
  args: {
    value: { end: "2026-05-30" },
  },
}
