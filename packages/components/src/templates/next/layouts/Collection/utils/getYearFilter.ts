import type { Filter } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"

export const getYearFilter = (
  items: ProcessedCollectionCardProps[],
): Filter => {
  const years: Record<string, number> = {}
  let numberOfUndefinedDates = 0

  items.forEach(({ date }) => {
    if (date) {
      const year = date.getFullYear().toString()
      if (year in years && years[year]) {
        years[year] += 1
      } else {
        years[year] = 1
      }
    } else {
      numberOfUndefinedDates += 1
    }
  })

  const yearFilterItems = Object.entries(years)
    .map(([label, count]) => ({
      id: label.toLowerCase(),
      label,
      count,
    }))
    .sort((a, b) => parseInt(b.label) - parseInt(a.label))

  return {
    id: FILTER_ID_YEAR,
    label: "Year",
    // do not show "not specified" option if all items have undefined dates
    items:
      yearFilterItems.length === 0
        ? []
        : numberOfUndefinedDates === 0
          ? yearFilterItems
          : [
              ...yearFilterItems,
              {
                id: NO_SPECIFIED_YEAR_FILTER_ID,
                label: "Not specified",
                count: numberOfUndefinedDates,
              },
            ],
  }
}
