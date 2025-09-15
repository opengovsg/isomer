import type { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"

import type { DGSSearchableTableProps } from "~/interfaces"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import { DGSSearchableTable } from "./DGSSearchableTable"

const meta: Meta<DGSSearchableTableProps> = {
  title: "Next/Components/SearchableTable/DGS",
  component: DGSSearchableTable,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    title: "Sample DGS Table",
    dataSource: {
      type: "dgs",
      resourceId: "d_3c55210de27fcccda2ed0c63fdd2b352", // hardcoded
    },
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

const DgsUrl = generateDgsUrl({
  resourceId: "d_3c55210de27fcccda2ed0c63fdd2b352", // hardcoded
  fields: [
    "year",
    "university",
    "school",
    "degree",
    "gross_monthly_median",
    "gross_mthly_25_percentile",
    "gross_mthly_75_percentile",
  ].join(","),
})

export default meta
type Story = StoryObj<typeof DGSSearchableTable>

export const Default: Story = {}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () => {
          return new Promise(() => {
            // Never resolve the promise
          })
        }),
      ],
    },
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () => {
          return new HttpResponse(null, {
            status: 500,
          })
        }),
      ],
    },
  },
}
