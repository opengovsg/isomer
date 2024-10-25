import type { AppliedFilter, Filter as FilterType } from "../../types/Filter"
import type { CollectionCardProps } from "~/interfaces"
import { getParsedDate } from "~/utils"

const FILTER_ID_CATEGORY = "category"
const FILTER_ID_YEAR = "year"
const NO_SPECIFIED_YEAR_FILTER_ID = "not_specified"

export const getAvailableFilters = (
  items: CollectionCardProps[],
): FilterType[] => {
  const categories: Record<string, number> = {}
  const years: Record<string, number> = {}

  let numberOfUndefinedDates = 0

  items.forEach(({ category, lastUpdated }) => {
    // Step 1: Get all available categories
    if (category in categories && categories[category]) {
      categories[category] += 1
    } else {
      categories[category] = 1
    }

    // Step 2: Get all available years
    if (lastUpdated) {
      const year = getParsedDate(lastUpdated).getFullYear().toString()
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

  const availableFilters: FilterType[] = [
    {
      id: FILTER_ID_CATEGORY,
      label: "Category",
      items: Object.entries(categories)
        .map(([label, count]) => ({
          id: label.toLowerCase(),
          label: label.charAt(0).toUpperCase() + label.slice(1),
          count,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
    {
      id: FILTER_ID_YEAR,
      label: "Year",
      items:
        // do not show "not specified" option if all items have undefined dates
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
    },
  ]

  // Remove filters with no items
  return availableFilters.filter((filter) => filter.items.length > 0)
}

export const getFilteredItems = (
  items: CollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
): CollectionCardProps[] => {
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

    return true
  })
}

export const getPaginatedItems = (
  items: CollectionCardProps[],
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

export const shouldShowDate = (items: CollectionCardProps[]): boolean => {
  return items.some((item) => item.lastUpdated)
}
