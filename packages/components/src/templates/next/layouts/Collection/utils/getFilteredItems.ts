import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { isDateFilter, isTextFilter } from "~/types/page"

import type { AppliedFilter } from "../../../types/Filter"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"
import { getDateFilterStatus } from "./getDateFilterStatus"
import { normalizeCollectionSearchText } from "./normalizeCollectionSearchText"

export const getFilteredItems = (
  items: ProcessedCollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
  tagCategories?: CollectionPagePageProps["tagCategories"],
): ProcessedCollectionCardProps[] => {
  const normalizedSearchValue =
    searchValue !== "" ? normalizeCollectionSearchText(searchValue) : ""

  const yearFilter = appliedFilters.find(
    (filter) => filter.id === FILTER_ID_YEAR,
  )

  // Text filters (isTextFilter): match on category.label; legacy rows omit `type`.
  const textFilters = appliedFilters.filter(
    ({ id }) =>
      id !== FILTER_ID_YEAR &&
      tagCategories?.some(
        (category) => category.label === id && isTextFilter(category),
      ),
  )

  // Date filters (isDateFilter): match on category.id; always `type: "date"`.
  const dateFilters = appliedFilters.filter(
    ({ id }) =>
      id !== FILTER_ID_YEAR &&
      tagCategories?.some(
        (category) => category.id === id && isDateFilter(category),
      ),
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

    // Step 3: Text filters (isTextFilter): match item.tags on category.label; OR within filter, AND between filters.
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

    // Step 4: Date filters (isDateFilter): match item.dateTagged on category.id; status buckets and date ranges.
    const matchesDateFilters = dateFilters.every((appliedFilter) => {
      const value = item.dateTagged?.find(({ id }) => id === appliedFilter.id)
      if (!value) {
        return false
      }

      const matchesBucket =
        appliedFilter.items.length === 0 ||
        appliedFilter.items.some(
          ({ id: statusId }) => getDateFilterStatus(value) === statusId,
        )

      const matchesRange =
        !appliedFilter.dateRange ||
        (value.date <= appliedFilter.dateRange.end &&
          (value.endDate ?? value.date) >= appliedFilter.dateRange.start)

      return matchesBucket && matchesRange
    })

    if (!matchesDateFilters) {
      return false
    }

    return true
  })
}
