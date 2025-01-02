import type { Filter } from "../../../types/Filter"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"

export const getYearFilter = ({
  years,
  numberOfUndefinedDates,
}: {
  years: Record<string, number>
  numberOfUndefinedDates: number
}): Filter => {
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
