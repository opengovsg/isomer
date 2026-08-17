import type { ProcessedCollectionCardProps } from "~/interfaces"

import type { AppliedFilter } from "../../../types/Filter"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"
import { getDateFilterStatus, getTodayInSingapore } from "./getDateFilterStatus"
import { normalizeCollectionSearchText } from "./normalizeCollectionSearchText"

export const getFilteredItems = (
  items: ProcessedCollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
): ProcessedCollectionCardProps[] => {
  const normalizedSearchValue =
    searchValue !== "" ? normalizeCollectionSearchText(searchValue) : ""

  const today = getTodayInSingapore()

  // NOTE: a filter id counts as "date-type" if any item carries a raw
  // `dateTagged` entry for it. Date filters are handled entirely in
  // Step 4 below rather than via Step 3's tag-membership reduce — unlike
  // text filters, a date filter's bucket ids aren't discovered from items
  // via `getTagFilters`' generic unique-value scan (that scan would also
  // pick up date-derived values if they were merged into `item.tags`,
  // producing a second, malformed Filter for the same id), and range
  // matching needs the raw dates, which `item.tags` doesn't carry at all.
  const dateFilterIds = new Set(
    items.flatMap((item) => item.dateTagged?.map(({ id }) => id) ?? []),
  )

  return items.filter((item) => {
    // Step 1: Filter based on search value
    if (
      normalizedSearchValue !== "" &&
      !normalizeCollectionSearchText(item.title).includes(
        normalizedSearchValue,
      ) &&
      !normalizeCollectionSearchText(item.description ?? "").includes(
        normalizedSearchValue,
      )
    ) {
      return false
    }

    // Step 2: Remove items that do not match the applied year filters
    const yearFilter = appliedFilters.find(
      (filter) => filter.id === FILTER_ID_YEAR,
    )
    if (
      yearFilter &&
      !yearFilter.items.some((filterItem) =>
        item.date
          ? // if date is defined, check if year matches
            item.date.getFullYear().toString() === filterItem.id
          : // if undefined date, check if "not specified" filter is applied
            filterItem.id === NO_SPECIFIED_YEAR_FILTER_ID,
      )
    ) {
      return false
    }

    const remainingFilters = appliedFilters.filter(
      ({ id }) => id !== FILTER_ID_YEAR && !dateFilterIds.has(id),
    )

    // Step 3: Compute set intersection between remaining (text) filters and the set of items.
    // Take note that we use OR between items within the same filter and AND between filters.
    const matchesTextFilters = remainingFilters
      .map(({ items: activeFilters, id }) => {
        return item.tags?.some(({ category, selected: itemLabels }) => {
          return (
            category === id &&
            activeFilters
              .map(({ id }) => id)
              .reduce((prev, cur) => {
                return prev || itemLabels.includes(cur)
              }, false) //includes(itemLabels)
          )
        })
      })
      .every((x) => x)

    if (!matchesTextFilters) {
      return false
    }

    // Step 4: Date filters — bucket (status) and date-range both apply
    // together (AND'd) within one filter; AND across filters, same as text.
    const dateFilters = appliedFilters.filter(({ id }) => dateFilterIds.has(id))

    return dateFilters.every((appliedFilter) => {
      const value = item.dateTagged?.find(({ id }) => id === appliedFilter.id)
      // Filter is active but this item has no value for it at all.
      if (!value) {
        return false
      }

      const matchesBucket =
        appliedFilter.items.length === 0 ||
        appliedFilter.items.some(
          ({ id: statusId }) => getDateFilterStatus(value, today) === statusId,
        )

      const matchesRange =
        !appliedFilter.dateRange ||
        (value.date <= appliedFilter.dateRange.end &&
          (value.endDate ?? value.date) >= appliedFilter.dateRange.start)

      return matchesBucket && matchesRange
    })
  })
}
