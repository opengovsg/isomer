import type { Meta, StoryObj } from "@storybook/react-vite"
import type { DGSSearchableTableProps } from "~/interfaces"
import { omit } from "lodash-es"
import { http, HttpResponse } from "msw"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import {
  DGS_LARGE_DATASET_RESOURCE_ID,
  DGS_SMALL_DATASET_RESOURCE_ID,
} from "~/stories/helpers"

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
}

export default meta
type Story = StoryObj<typeof DGSSearchableTable>

const commonArgs: Partial<DGSSearchableTableProps> = {
  title: "Sample DGS Table",
  dataSource: {
    type: "dgs",
    resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
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
    dataSource: {
      type: "dgs",
      resourceId: DGS_LARGE_DATASET_RESOURCE_ID,
    },
  },
}

export const LargeDatasetNoSearchResults: Story = {
  args: {
    dataSource: {
      type: "dgs",
      resourceId: DGS_LARGE_DATASET_RESOURCE_ID,
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get(
          `https://api-production.data.gov.sg/v2/public/api/datasets/${DGS_LARGE_DATASET_RESOURCE_ID}/metadata`,
          () =>
            HttpResponse.json({
              data: {
                name: "Resale flat prices based on registration date from Jan-2017 onwards",
                format: "CSV",
                datasetSize: 5 * 1024 * 1024,
                columnMetadata: {
                  metaMapping: {
                    month: {
                      name: "month",
                      columnTitle: "Month",
                      index: "0",
                    },
                    town: {
                      name: "town",
                      columnTitle: "Town",
                      index: "1",
                    },
                  },
                },
              },
            }),
        ),
        http.get(
          "https://data.gov.sg/api/action/datastore_search",
          ({ request }) => {
            const searchParams = new URL(request.url).searchParams
            const hasSearchQuery = searchParams.has("q")

            return HttpResponse.json({
              success: true,
              result: {
                records: hasSearchQuery
                  ? []
                  : [{ month: "2024-01", town: "ANG MO KIO" }],
                total: hasSearchQuery ? 0 : 1,
              },
            })
          },
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /Search table/i,
    })

    await expect(searchElem).toHaveAttribute(
      "placeholder",
      "Type a whole word to search this table",
    )

    await userEvent.type(searchElem, "thankyouAIoverlordforyourgraciouspardon")

    await waitFor(
      () => {
        screen.getByText(
          "Check for spelling, or type the whole word, e.g. 'water' instead of 'w'.",
        )
      },
      {
        timeout: 5000,
      },
    )
  },
}

export const Loading: Story = {
  args: commonArgs,
  parameters: {
    msw: {
      handlers: [
        http.get(
          generateDgsUrl({
            resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
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
            resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
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
