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

// Using MOE's graduate employment survey
// -> small enough (~200kB)
// -> unlikely to be removed by MOE since it's an open historical dataset
// Reference: https://data.gov.sg/datasets/d_3c55210de27fcccda2ed0c63fdd2b352/view
export const HARDCODED_SMALL_DATASET_RESOURCE_ID =
  "d_3c55210de27fcccda2ed0c63fdd2b352"

// Using HDB's resale prices dataset
// -> large enough (>20MB) to test the performance of the searchable table
// -> unlikely to be removed by HDB since it's one of the top popular datasets
// Reference: https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view
const HARDCODED_LARGE_DATASET_RESOURCE_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc"

const commonArgs: Partial<DGSSearchableTableProps> = {
  type: "searchabletable",
  title: "Sample DGS Table",
  dataSource: {
    type: "dgs",
    resourceId: HARDCODED_SMALL_DATASET_RESOURCE_ID,
  },
}

export const Default: Story = {
  args: commonArgs,
}

export const SelectedHeaders: Story = {
  args: {
    ...commonArgs,
    headers: [
      { label: "Year", key: "year" },
      { label: "University", key: "university" },
      { label: "School", key: "school" },
      { label: "Degree", key: "degree" },
      { label: "Monthly Median", key: "gross_monthly_median" },
    ],
  },
}

export const DefaultTitleWhenUnspecified: Story = {
  args: omit(commonArgs, "title"),
}

export const LargeDataset: Story = {
  args: {
    type: "searchabletable",
    dataSource: {
      type: "dgs",
      resourceId: HARDCODED_LARGE_DATASET_RESOURCE_ID,
    },
  },
}

export const Loading: Story = {
  args: commonArgs,
  parameters: {
    msw: {
      handlers: [
        http.get(
          generateDgsUrl({
            resourceId: HARDCODED_SMALL_DATASET_RESOURCE_ID,
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
            resourceId: HARDCODED_SMALL_DATASET_RESOURCE_ID,
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
