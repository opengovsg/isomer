import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { getDateFilterStatus } from "~/templates/next/components/internal/CollectionCard/utils/getDateFilterStatus"
import { isDateFilter } from "~/types/page"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import type { AppliedFilter } from "../../../types/Filter"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"
import { normalizeCollectionSearchText } from "./normalizeCollectionSearchText"

export const getFilteredItems = (
  items: ProcessedCollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
  tagCategories?: CollectionPagePageProps["tagCategories"],
  today: string = getSingaporeDateYYYYMMDD(),
): ProcessedCollectionCardProps[] => {
  const normalizedSearchValue =
    searchValue !== "" ? normalizeCollectionSearchText(searchValue) : ""

  const dateFilterIds = new Set(
    tagCategories?.filter(isDateFilter).map((category) => category.id) ?? [],
  )

  const yearFilter = appliedFilters.find(
    (filter) => filter.id === FILTER_ID_YEAR,
  )
  const dateFilters = appliedFilters.filter(({ id }) => dateFilterIds.has(id))
  const textFilters = appliedFilters.filter(
    ({ id }) => id !== FILTER_ID_YEAR && !dateFilterIds.has(id),
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

    // Step 3: Compute set intersection between remaining filters and the set of items.
    // Take note that we use OR between items within the same filter and AND between filters.
    const matchesTextFilters = textFilters
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

    // Step 4: Match date status buckets and date ranges
    return dateFilters.every((appliedFilter) => {
      const value = item.dateTagged?.find(({ id }) => id === appliedFilter.id)
      if (!value) {
        return false
      }

      const matchesBucket =
        appliedFilter.items.length === 0 ||
        appliedFilter.items.some(
          ({ id: statusId }) =>
            getDateFilterStatus({ ...value, today }) === statusId,
        )

      const matchesRange =
        !appliedFilter.dateRange ||
        (value.date <= appliedFilter.dateRange.end &&
          (value.endDate ?? value.date) >= appliedFilter.dateRange.start)

      return matchesBucket && matchesRange
    })
  })
}
