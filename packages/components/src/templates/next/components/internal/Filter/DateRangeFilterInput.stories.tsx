import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { userEvent, within } from "storybook/test"

import { withChromaticModes } from "@isomer/storybook-config"

import type { DateRangeFilterValue } from "./DateRangeFilterInput"
import { DateRangeFilterInput } from "./DateRangeFilterInput"

const meta: Meta<typeof DateRangeFilterInput> = {
  title: "Next/Internal Components/Filter/DateRangeFilterInput",
  component: DateRangeFilterInput,
  // Controlled component — wrap with local state so onChange (typing a
  // selection + pressing Apply in the calendar) is actually reflected back
  // into the trigger's displayed value, same pattern as Filter.stories.tsx.
  render: ({ value: initialValue, presentation }) => {
    const [value, setValue] = useState<DateRangeFilterValue | undefined>(
      initialValue,
    )
    return (
      <DateRangeFilterInput
        value={value}
        onChange={setValue}
        presentation={presentation}
      />
    )
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: withChromaticModes(["desktop"]),
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

export const WithSingleDateApplied: Story = {
  name: "With single date applied (not shown as a range)",
  args: {
    value: { start: "2026-08-13", end: "2026-08-13" },
  },
}

export const OpenedCalendar: Story = {
  args: {
    value: undefined,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText("DD/MM/YYYY"))
    // Calendar renders in a portal-less absolutely-positioned popover within
    // the same canvas, so no need to escape to `canvasElement.parentElement`.
    await screen.findByText("Apply")
  },
}

export const SelectRangeAndApply: Story = {
  args: {
    value: undefined,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText("DD/MM/YYYY"))

    await userEvent.click(screen.getByText("10"))
    await userEvent.click(screen.getByText("20"))
    await userEvent.click(await screen.findByText("Apply"))
  },
}

export const ModalPresentation: Story = {
  args: {
    value: undefined,
    presentation: "modal",
  },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText("DD/MM/YYYY"))
    await screen.findByText("Clear")
    await screen.findByText("Apply")
  },
}

export const ClearAppliedRange: Story = {
  args: {
    value: { start: "2026-04-28", end: "2026-05-30" },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText("28/04/2026 - 30/05/2026"))
    await userEvent.click(await screen.findByText("Clear"))
  },
}
