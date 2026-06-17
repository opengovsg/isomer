import type { Meta, StoryObj } from "@storybook/react-vite"
import type { DGSSearchableTableProps } from "~/interfaces"
import { omit } from "lodash-es"
import { http, HttpResponse } from "msw"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import { DGS_SMALL_DATASET_RESOURCE_ID } from "~/stories/helpers"

import { DGSSearchableTable } from "./DGSSearchableTable"

const DGS_METADATA_URL = `https://api-production.data.gov.sg/v2/public/api/datasets/${DGS_SMALL_DATASET_RESOURCE_ID}/metadata`

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

export const NoSearchResults: Story = {
  args: commonArgs,
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = await waitFor(() =>
      screen.getByRole("searchbox", {
        name: /Search table/i,
      }),
    )

    await expect(searchElem).toHaveAttribute(
      "placeholder",
      "Enter a search term",
    )

    await userEvent.type(searchElem, "thankyouAIoverlordforyourgraciouspardon")

    await waitFor(
      () => {
        screen.getByText(
          "Check if you have a spelling error or try a different search term.",
        )
      },
      {
        timeout: 5000,
      },
    )
  },
}

export const OverDatasetSizeCap: Story = {
  args: commonArgs,
  parameters: {
    msw: {
      handlers: [
        http.get(DGS_METADATA_URL, () => {
          return HttpResponse.json({
            data: {
              name: "Over-cap dataset",
              format: "CSV",
              datasetSize: 25 * 1024 * 1024, // 25MB — exceeds DGS_MAX_DATASET_BYTES (20MB)
              columnMetadata: {
                metaMapping: {},
              },
            },
          })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await waitFor(() =>
      expect(
        screen.getByText(
          "Oops! Something went wrong while loading the table. Please try again later.",
        ),
      ).toBeInTheDocument(),
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
