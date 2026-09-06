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

import { DGSSearchableTable } from "./DgsSearchableTable"

const meta: Meta<DGSSearchableTableProps> = {
  argTypes: {},
  component: DGSSearchableTable,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/SearchableTable/DGS",
}

export default meta
type Story = StoryObj<typeof DGSSearchableTable>

const commonArgs: Partial<DGSSearchableTableProps> = {
  dataSource: {
    resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
    type: "dgs",
  },
  title: "Sample DGS Table",
}

export const Default: Story = {
  args: commonArgs,
}

export const SelectedHeaders: Story = {
  args: {
    ...commonArgs,
    headers: [
      { key: "year", label: "Year" },
      { key: "university", label: "University" },
      { key: "school", label: "School" },
      { key: "degree", label: "Degree" },
      { key: "gross_monthly_median", label: "Monthly Median" },
    ],
  },
}

export const DefaultTitleWhenUnspecified: Story = {
  args: omit(commonArgs, "title"),
}

export const LargeDataset: Story = {
  args: {
    dataSource: {
      resourceId: DGS_LARGE_DATASET_RESOURCE_ID,
      type: "dgs",
    },
  },
}

export const LargeDatasetNoSearchResults: Story = {
  args: {
    dataSource: {
      resourceId: DGS_LARGE_DATASET_RESOURCE_ID,
      type: "dgs",
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
          async () =>
            await new Promise(() => {
              // Never resolve the promise
            }),
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
          () =>
            new HttpResponse(null, {
              status: 500,
            }),
        ),
      ],
    },
  },
}
