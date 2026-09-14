import type { Meta, StoryObj } from "@storybook/react-vite"
import type { AppliedFilter } from "~/templates/next/types/Filter"
import { useState } from "react"
import { expect, userEvent, within } from "storybook/test"
import { toggleAppliedFilterItem } from "~/templates/next/layouts/Collection/utils"
import { DATE_FILTER_STATUS, TAG_CATEGORY_TYPE } from "~/types/constants"

import { getViewportByMode, withChromaticModes } from "@isomer/storybook-config"

import { Filter } from "./Filter"

const meta: Meta<typeof Filter> = {
  title: "Next/Internal Components/Filter",
  component: Filter,
  render: ({ filters, appliedFilters: _appliedFilters }) => {
    const [appliedFilters, setAppliedFilters] =
      useState<AppliedFilter[]>(_appliedFilters)
    const handleClearFilter = () => {
      setAppliedFilters([])
    }

    return (
      <Filter
        filters={filters}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        handleFilterToggle={(id: string, itemId: string) =>
          toggleAppliedFilterItem({
            appliedFilters,
            setAppliedFilters,
            filterId: id,
            itemId,
          })
        }
        handleClearFilter={handleClearFilter}
      />
    )
  },
  parameters: {
    viewport: {
      defaultViewport: "reset",
    },
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    filters: [
      {
        id: "type",
        label: "Testing a long filter label to test how it wraps or truncates",
        items: [
          { id: "article", label: "Article", count: 1204 },
          { id: "speech", label: "Speech", count: 888 },
          { id: "press-release", label: "Press Release", count: 560 },
          { id: "blog", label: "Blog", count: 120 },
        ],
      },
      {
        id: "category",
        label: "Category",
        items: [
          { id: "checkbox-default-1", label: "Checkbox Default 1", count: 235 },
          { id: "checkbox-default-2", label: "Checkbox Default 2", count: 323 },
          { id: "checkbox-default-3", label: "Checkbox Default 3", count: 892 },
          { id: "checkbox-default-4", label: "Checkbox Default 4", count: 28 },
        ],
      },
      {
        id: "year",
        label: "Year",
        items: [
          { id: "2024", label: "2024", count: 123 },
          { id: "2023", label: "2023", count: 745 },
          { id: "2022", label: "2022", count: 234 },
          { id: "2021", label: "2021", count: 289 },
          { id: "2020", label: "2020", count: 90 },
        ],
      },
    ],
    appliedFilters: [],
  },
}
export default meta
type Story = StoryObj<typeof Filter>

// Default scenario
export const Default: Story = {
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}

export const WithSomeSelected: Story = {
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
  args: {
    appliedFilters: [
      { id: "type", items: [{ id: "article" }, { id: "speech" }] },
      { id: "category", items: [{ id: "checkbox-default-1" }] },
    ],
  },
}

export const MobileFilterButton: Story = {
  globals: { viewport: getViewportByMode("mobile") },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
  args: WithSomeSelected.args,
}

export const MobileFilterDrawer: Story = {
  parameters: MobileFilterButton.parameters,
  args: MobileFilterButton.args,
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const button = await screen.findByRole("button", {
      name: /filter results/i,
    })
    await userEvent.click(button)
  },
}

export const MobileFilterDrawerClearAll: Story = {
  parameters: MobileFilterButton.parameters,
  args: MobileFilterButton.args,
  play: async (context) => {
    const { canvasElement } = context
    // Required since drawer is a portal
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    const screen = within(canvasElement.parentElement!)

    await MobileFilterDrawer.play?.(context)
    await userEvent.click(
      screen.getByRole("button", { name: /clear all filters/i }),
    )
  },
}

export const NoFilters: Story = {
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
  args: {
    filters: [],
    appliedFilters: [],
  },
}

const DATE_FILTER = {
  id: "event-date",
  label: "Event date",
  type: TAG_CATEGORY_TYPE.Date,
  items: [
    {
      id: DATE_FILTER_STATUS.Upcoming.id,
      label: "Upcoming",
      count: 12,
    },
    {
      id: DATE_FILTER_STATUS.Ongoing.id,
      label: "Ongoing",
      count: 10,
    },
    {
      id: DATE_FILTER_STATUS.Ended.id,
      label: "Ended",
      count: 2,
    },
  ],
}

export const WithDateFilter: Story = {
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
  args: {
    filters: [DATE_FILTER],
    appliedFilters: [
      {
        id: "event-date",
        items: [{ id: DATE_FILTER_STATUS.Upcoming.id }],
        dateRange: { start: "2026-04-01", end: "2026-04-30" },
      },
    ],
  },
}

export const MobileDateFilterDrawer: Story = {
  globals: { viewport: getViewportByMode("mobile") },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
  args: WithDateFilter.args,
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const button = await screen.findByRole("button", {
      name: /filter results/i,
    })
    await userEvent.click(button)
  },
}

const dateFilterDesktopParameters = {
  chromatic: withChromaticModes(["desktop"]),
  globals: { viewport: getViewportByMode("desktop") },
}

const createDateFilter = (visibility: {
  showStatusLabelsFilter: boolean
  showDateRangeFilter: boolean
}) => ({
  ...DATE_FILTER,
  ...visibility,
})

const assertDateFilterControls = async (
  canvas: ReturnType<typeof within>,
  {
    showStatusLabelsFilter,
    showDateRangeFilter,
  }: {
    showStatusLabelsFilter: boolean
    showDateRangeFilter: boolean
  },
) => {
  if (showStatusLabelsFilter) {
    await expect(
      await canvas.findByRole("checkbox", { name: /Ongoing \(10\)/i }),
    ).toBeInTheDocument()
  } else {
    await expect(
      canvas.queryByRole("checkbox", { name: /Ongoing \(10\)/i }),
    ).not.toBeInTheDocument()
  }

  if (showDateRangeFilter) {
    await expect(await canvas.findByLabelText(/^From$/i)).toBeInTheDocument()
    await expect(await canvas.findByLabelText(/^To$/i)).toBeInTheDocument()
  } else {
    await expect(canvas.queryByLabelText(/^From$/i)).not.toBeInTheDocument()
  }
}

export const DateFilterStatusLabelsOnly: Story = {
  parameters: dateFilterDesktopParameters,
  args: {
    filters: [
      createDateFilter({
        showStatusLabelsFilter: true,
        showDateRangeFilter: false,
      }),
    ],
    appliedFilters: [],
  },
  play: async ({ canvasElement }) => {
    await assertDateFilterControls(within(canvasElement), {
      showStatusLabelsFilter: true,
      showDateRangeFilter: false,
    })
  },
}

export const DateFilterDateRangeOnly: Story = {
  parameters: dateFilterDesktopParameters,
  args: {
    filters: [
      createDateFilter({
        showStatusLabelsFilter: false,
        showDateRangeFilter: true,
      }),
    ],
    appliedFilters: [],
  },
  play: async ({ canvasElement }) => {
    await assertDateFilterControls(within(canvasElement), {
      showStatusLabelsFilter: false,
      showDateRangeFilter: true,
    })
  },
}

export const DateFilterBothControls: Story = {
  parameters: dateFilterDesktopParameters,
  args: {
    filters: [
      createDateFilter({
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
      }),
    ],
    appliedFilters: [],
  },
  play: async ({ canvasElement }) => {
    await assertDateFilterControls(within(canvasElement), {
      showStatusLabelsFilter: true,
      showDateRangeFilter: true,
    })
  },
}

export const DateFilterDateRangeOnlyMobileDrawer: Story = {
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
    globals: { viewport: getViewportByMode("mobile") },
  },
  args: DateFilterDateRangeOnly.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /filter results/i }),
    )
    // Drawer renders in a portal outside the story canvas. Scope to the
    // dialog so we don't also match the desktop aside (hidden in DOM on mobile).
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    const screen = within(canvasElement.parentElement!)
    const dialog = await screen.findByRole("dialog")
    await assertDateFilterControls(within(dialog), {
      showStatusLabelsFilter: false,
      showDateRangeFilter: true,
    })
  },
}
