import type { Meta, StoryObj } from "@storybook/react-vite"
import type { DGSSearchableTableProps } from "~/interfaces"
import { omit } from "lodash-es"
import { http, HttpResponse } from "msw"
import { expect, within } from "storybook/test"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import {
  DGS_LARGE_DATASET_RESOURCE_ID,
  DGS_SMALL_DATASET_RESOURCE_ID,
} from "~/stories/helpers"

import { SearchableTableClient } from "../shared"
import { SearchableTableClientUI } from "../shared/SearchableTableClientUI"
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
  render: () => (
    <SearchableTableClientUI
      title="Resale flat prices based on registration date from Jan-2017 onwards"
      headers={["Month", "Town"]}
      search={{
        input: "thankyouAIoverlordforyourgraciouspardon",
        deferred: "thankyouAIoverlordforyourgraciouspardon",
        setSearch: () => undefined,
      }}
      page={{ currPage: 1, setCurrPage: () => undefined }}
      isInitiallyEmpty={false}
      isFilteredEmpty
      maxNoOfColumns={2}
      paginatedItems={[]}
      filteredItemsLength={0}
      searchMatchType="fullTextMatch"
    />
  ),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    await expect(
      screen.getByText(
        "Check for spelling, or type the whole word, e.g. 'water' instead of 'w'.",
      ),
    ).toBeVisible()
    await expect(
      screen.getByRole("searchbox", { name: /Search table/i }),
    ).toHaveValue("thankyouAIoverlordforyourgraciouspardon")
  },
}

export const Loading: Story = {
  render: () => (
    <SearchableTableClient
      title={commonArgs.title}
      headers={[]}
      items={[]}
      isLoading
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Loading...")).toBeVisible()
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
