import type {
  AppliedFilter,
  FilterItem,
  Filter as FilterType,
} from "../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import { getParsedDate } from "~/utils"
import {
  FILTER_ID_CATEGORY,
  FILTER_ID_YEAR,
  getCategoryFilters,
  getYearFilters,
  NO_SPECIFIED_YEAR_FILTER_ID,
} from "./filterUtils"

const getCategories = (
  tagCategories: Record<string, Record<string, number>>,
): FilterType[] => {
  return Object.entries(tagCategories).reduce((acc: FilterType[], curValue) => {
    const [category, values] = curValue
    const items: FilterItem[] = Object.entries(values).map(
      ([label, count]) => ({
        label,
        count,
        id: label,
      }),
    )

    const filters: FilterType[] = [
      ...acc,
      {
        items,
        id: category,
        label: category,
      },
    ]

    return filters
  }, [])
}

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
): FilterType[] => {
  const categories: Record<string, number> = {}
  const years: Record<string, number> = {}
  // NOTE: Each tag is a mapping of a category to its
  // associated set of values as well as the selected value.
  // Hence, we store a map here of the category (eg: Body parts)
  // to the number of occurences of each value (eg: { Brain: 3, Leg: 2})
  const tagCategories: Record<string, Record<string, number>> = {}

  let numberOfUndefinedDates = 0

  items.forEach(({ category, lastUpdated, tags }) => {
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

    // Step 3: Get all category tags
    if (tags) {
      tags.forEach(({ selected: selectedLabels, category }) => {
        selectedLabels.forEach((label) => {
          if (!tagCategories[category]) {
            tagCategories[category] = {}
          }
          if (!tagCategories[category][label]) {
            tagCategories[category][label] = 0
          }

          tagCategories[category][label] += 1
        })
      })
    }
  })

  const availableFilters: FilterType[] = [
    getCategoryFilters({ categories }),
    getYearFilters({ years, numberOfUndefinedDates }),
    ...getCategories(tagCategories),
  ]

  // Remove filters with no items
  return availableFilters.filter((filter) => filter.items.length > 0)
}

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
