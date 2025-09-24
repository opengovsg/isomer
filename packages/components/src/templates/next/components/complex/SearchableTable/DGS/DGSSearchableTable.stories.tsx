import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, waitFor, within } from "@storybook/test"
import { omit } from "lodash"
import { http, HttpResponse } from "msw"

import type { DGSSearchableTableProps } from "~/interfaces"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import {
  DGS_LARGE_DATASET_RESOURCE_ID,
  DGS_SMALL_DATASET_RESOURCE_ID,
} from "~/stories/helpers"
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

const commonArgs: Partial<DGSSearchableTableProps> = {
  type: "searchabletable",
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
    type: "searchabletable",
    dataSource: {
      type: "dgs",
      resourceId: DGS_LARGE_DATASET_RESOURCE_ID,
    },
  },
}

export const LargeDatasetNoSearchResults: Story = {
  args: {
    type: "searchabletable",
    dataSource: {
      type: "dgs",
      resourceId: DGS_LARGE_DATASET_RESOURCE_ID,
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
