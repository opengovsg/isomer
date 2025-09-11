import type { Meta, StoryObj } from "@storybook/react"
import { omit } from "lodash"
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
}

export default meta
type Story = StoryObj<typeof DGSSearchableTable>

const commonArgs = {
  type: "searchabletable",
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
} as DGSSearchableTableProps

export const Default: Story = {
  args: omit(commonArgs, "headers"),
}

export const SelectedHeaders: Story = {
  args: commonArgs,
}

export const DefaultTitleWhenUnspecified: Story = {
  args: omit(commonArgs, "title"),
}

export const Loading: Story = {
  args: commonArgs,
  parameters: {
    msw: {
      handlers: [
        http.get(
          generateDgsUrl({
            resourceId: "d_3c55210de27fcccda2ed0c63fdd2b352", // hardcoded
          }),
          () => {
            return new Promise(() => {
              // Never resolve the promise
            })
          },
        ),
      ],
    },
  },
}

export const Error: Story = {
  args: commonArgs,
  parameters: {
    msw: {
      handlers: [
        http.get(
          generateDgsUrl({
            resourceId: "d_3c55210de27fcccda2ed0c63fdd2b352", // hardcoded
          }),
          () => {
            return new HttpResponse(null, {
              status: 500,
            })
          },
        ),
      ],
    },
  },
}
