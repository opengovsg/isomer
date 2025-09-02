import type { AppliedFilter } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import {
  FILTER_ID_CATEGORY,
  FILTER_ID_YEAR,
  NO_SPECIFIED_YEAR_FILTER_ID,
} from "./constants"

export const getFilteredItems = (
  items: ProcessedCollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
): ProcessedCollectionCardProps[] => {
  return items.filter((item) => {
    // Step 1: Filter based on search value
    if (
      searchValue !== "" &&
      !item.title.toLowerCase().includes(searchValue.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchValue.toLowerCase())
    ) {
      return false
    }

    // Step 2: Remove items that do not match the applied category filters
    const categoryFilter = appliedFilters.find(
      (filter) => filter.id === FILTER_ID_CATEGORY,
    )
    if (
      categoryFilter &&
      !categoryFilter.items.some(
        (filterItem) => filterItem.id === item.category.toLowerCase(),
      )
    ) {
      return false
    }

    // Step 3: Remove items that do not match the applied year filters
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
      ({ id }) => id !== FILTER_ID_CATEGORY && id !== FILTER_ID_YEAR,
    )

    // Step 4: Compute set intersection between remaining filters and the set of items.
    // Take note that we use OR between items within the same filter and AND between filters.
    return remainingFilters
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
  })
}
