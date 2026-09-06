import type { Meta, StoryObj } from "@storybook/react-vite"
import type { AppliedFilter } from "~/templates/next/types/Filter"
import { useState } from "react"
import { userEvent, within } from "storybook/test"

import { getViewportByMode, withChromaticModes } from "@isomer/storybook-config"

import { Filter } from "./Filter"

const meta: Meta<typeof Filter> = {
  args: {
    appliedFilters: [],
    filters: [
      {
        id: "type",
        items: [
          { count: 1204, id: "article", label: "Article" },
          { count: 888, id: "speech", label: "Speech" },
          { count: 560, id: "press-release", label: "Press Release" },
          { count: 120, id: "blog", label: "Blog" },
        ],
        label: "Testing a long filter label to test how it wraps or truncates",
      },
      {
        id: "category",
        items: [
          { count: 235, id: "checkbox-default-1", label: "Checkbox Default 1" },
          { count: 323, id: "checkbox-default-2", label: "Checkbox Default 2" },
          { count: 892, id: "checkbox-default-3", label: "Checkbox Default 3" },
          { count: 28, id: "checkbox-default-4", label: "Checkbox Default 4" },
        ],
        label: "Category",
      },
      {
        id: "year",
        items: [
          { count: 123, id: "2024", label: "2024" },
          { count: 745, id: "2023", label: "2023" },
          { count: 234, id: "2022", label: "2022" },
          { count: 289, id: "2021", label: "2021" },
          { count: 90, id: "2020", label: "2020" },
        ],
        label: "Year",
      },
    ],
  },
  component: Filter,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
    viewport: {
      defaultViewport: "reset",
    },
  },
  render: ({ filters, appliedFilters: _appliedFilters }) => {
    const [appliedFilters, setAppliedFilters] =
      useState<AppliedFilter[]>(_appliedFilters)
    const updateAppliedFilters = (
      appliedFilters: AppliedFilter[],
      setAppliedFilters: (appliedFilters: AppliedFilter[]) => void,
      filterId: string,
      itemId: string,
    ) => {
      const filterIndex = appliedFilters.findIndex(
        (filter) => filter.id === filterId,
      )
      if (filterIndex === -1) {
        setAppliedFilters([
          ...appliedFilters,
          { id: filterId, items: [{ id: itemId }] },
        ])
      } else {
        const itemIndex = appliedFilters[filterIndex]?.items.findIndex(
          (item) => item.id === itemId,
        )
        if (itemIndex !== undefined && itemIndex > -1) {
          const newAppliedFilters = [...appliedFilters]
          newAppliedFilters[filterIndex]?.items.splice(itemIndex, 1)

          if (newAppliedFilters[filterIndex]?.items.length === 0) {
            newAppliedFilters.splice(filterIndex, 1)
          }
          setAppliedFilters(newAppliedFilters)
        } else {
          const newAppliedFilters = [...appliedFilters]
          newAppliedFilters[filterIndex]?.items.push({ id: itemId })
          setAppliedFilters(newAppliedFilters)
        }
      }
    }

    const handleClearFilter = () => {
      setAppliedFilters([])
    }

    return (
      <Filter
        filters={filters}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        handleFilterToggle={(id: string, itemId: string) => {
          updateAppliedFilters(appliedFilters, setAppliedFilters, id, itemId)
        }}
        handleClearFilter={handleClearFilter}
      />
    )
  },
  title: "Next/Internal Components/Filter",
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
  args: {
    appliedFilters: [
      { id: "type", items: [{ id: "article" }, { id: "speech" }] },
      { id: "category", items: [{ id: "checkbox-default-1" }] },
    ],
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}

export const MobileFilterButton: Story = {
  args: WithSomeSelected.args,
  globals: { viewport: getViewportByMode("mobile") },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
}

export const MobileFilterDrawer: Story = {
  args: MobileFilterButton.args,
  parameters: MobileFilterButton.parameters,
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const button = await screen.findByRole("button", {
      name: /filter results/iu,
    })
    await userEvent.click(button)
  },
}

export const MobileFilterDrawerClearAll: Story = {
  args: MobileFilterButton.args,
  parameters: MobileFilterButton.parameters,
  play: async (context) => {
    const { canvasElement } = context
    // Required since drawer is a portal
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    const screen = within(canvasElement.parentElement!)

    await MobileFilterDrawer.play?.(context)
    await userEvent.click(
      screen.getByRole("button", { name: /clear all filters/iu }),
    )
  },
}

export const NoFilters: Story = {
  args: {
    appliedFilters: [],
    filters: [],
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}
