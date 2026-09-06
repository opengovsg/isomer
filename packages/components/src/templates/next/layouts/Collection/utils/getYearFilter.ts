import type { ProcessedCollectionCardProps } from "~/interfaces"

import type { Filter } from "../../../types/Filter"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"

export const getYearFilter = (
  items: ProcessedCollectionCardProps[],
): Filter => {
  const years: Record<string, number> = {}
  let numberOfUndefinedDates = 0

  for (const { date } of items) {
    if (date === undefined || date === null) {
      numberOfUndefinedDates += 1
    } else {
      const year = date.getFullYear().toString()
      years[year] = (years[year] ?? 0) + 1
    }
  }

  const yearFilterItems = Object.entries(years)
    .map(([label, count]) => ({
      count,
      id: label.toLowerCase(),
      label,
    }))
    .toSorted(
      (a, b) => Math.trunc(Number(b.label)) - Math.trunc(Number(a.label)),
    )

  let filterItems = yearFilterItems
  if (yearFilterItems.length > 0 && numberOfUndefinedDates > 0) {
    filterItems = [
      ...yearFilterItems,
      {
        count: numberOfUndefinedDates,
        id: NO_SPECIFIED_YEAR_FILTER_ID,
        label: "Not specified",
      },
    ]
  }

  return {
    id: FILTER_ID_YEAR,
    items: filterItems,
    label: "Year",
  }
}
