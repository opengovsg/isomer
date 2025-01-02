import type { AppliedFilter } from "../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import {
  FILTER_ID_CATEGORY,
  FILTER_ID_YEAR,
  NO_SPECIFIED_YEAR_FILTER_ID,
} from "./filterUtils"

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
        item.lastUpdated
          ? // if date is defined, check if year matches
            new Date(item.lastUpdated).getFullYear().toString() ===
            filterItem.id
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

export const getPaginatedItems = (
  items: ProcessedCollectionCardProps[],
  itemsPerPage: number,
  currPage: number,
) => {
  const normalizedCurrPage = Math.max(1, currPage)

  return items.slice(
    (normalizedCurrPage - 1) * itemsPerPage,
    normalizedCurrPage * itemsPerPage,
  )
}

export const updateAppliedFilters = (
  appliedFilters: AppliedFilter[],
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void,
  filterId: string,
  itemId: string,
) => {
  const filterIndex = appliedFilters.findIndex(
    (filter) => filter.id === filterId,
  )
  const isFilterAlreadyApplied = filterIndex > -1
  if (isFilterAlreadyApplied) {
    const itemIndex = appliedFilters[filterIndex]?.items.findIndex(
      (item) => item.id === itemId,
    )
    if (itemIndex !== undefined && itemIndex > -1) {
      const newAppliedFilters = [...appliedFilters]
      newAppliedFilters[filterIndex]?.items.splice(itemIndex, 1)

      if (newAppliedFilters[filterIndex]?.items.length === 0) {
        newAppliedFilters.splice(filterIndex, 1)
      }

      setAppliedFilters(newAppliedFilters)
    } else {
      const newAppliedFilters = [...appliedFilters]
      newAppliedFilters[filterIndex]?.items.push({ id: itemId })
      setAppliedFilters(newAppliedFilters)
    }
  } else {
    setAppliedFilters([
      ...appliedFilters,
      { id: filterId, items: [{ id: itemId }] },
    ])
  }
}

export const shouldShowDate = (
  items: ProcessedCollectionCardProps[],
): boolean => {
  return items.some((item) => item.lastUpdated)
}
