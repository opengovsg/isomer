import type { Meta, StoryObj } from "@storybook/react"

import type { DGSSearchableTableProps } from "~/interfaces"
import { DGSSearchableTable } from "./DGSSearchableTable"

const meta: Meta<DGSSearchableTableProps> = {
  title: "Next/Internal Components/SearchableTable/DGS",
  component: DGSSearchableTable,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    type: "dgs",
    title: "Sample DGS Table",
    dgsResourceId: "d_3c55210de27fcccda2ed0c63fdd2b352", // hardcoded
    headers: [
      { label: "Year", key: "year" },
      { label: "University", key: "university" },
      { label: "School", key: "school" },
      { label: "Degree", key: "degree" },
      { label: "Monthly Median", key: "gross_monthly_median" },
      {
        label: "Monthly 25th Percentile",
        key: "gross_mthly_25_percentile",
      },
      {
        label: "Monthly 75th Percentile",
        key: "gross_mthly_75_percentile",
      },
    ],
  },
}

export default meta
type Story = StoryObj<typeof DGSSearchableTable>

export const Default: Story = {}
