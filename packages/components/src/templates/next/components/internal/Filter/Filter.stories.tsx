import type { Meta, StoryObj } from "@storybook/react"

import Filter from "./Filter"

const meta: Meta<typeof Filter> = {
  title: "Next/Internal Components/Filter",
  component: Filter,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    filters: [
      {
        id: "type",
        label: "Type",
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
export const Default: Story = {}
