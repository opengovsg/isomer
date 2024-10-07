import type { AppliedFilter, Filter as FilterType } from "../../types/Filter"
import type { CollectionCardProps } from "~/interfaces"

export const getAvailableFilters = (
  items: CollectionCardProps[],
): FilterType[] => {
  const categories: Record<string, number> = {}
  const variants: Record<string, number> = {}
  const years: Record<string, number> = {}

  items.forEach(({ category, variant, lastUpdated }) => {
    // Step 1: Get all available categories
    if (category in categories && categories[category]) {
      categories[category] += 1
    } else {
      categories[category] = 1
    }

    // Step 2: Get all available variants
    if (variant in variants && variants[variant]) {
      variants[variant] += 1
    } else {
      variants[variant] = 1
    }

    // Step 3: Get all available years
    if (lastUpdated) {
      const year = new Date(lastUpdated).getFullYear().toString()
      if (year in years && years[year]) {
        years[year] += 1
      } else {
        years[year] = 1
      }
    }
  })

  const availableFilters: FilterType[] = [
    {
      id: "category",
      label: "Category",
      items: Object.entries(categories).map(([label, count]) => ({
        id: label.toLowerCase(),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
      })),
    },
    {
      id: "variant",
      label: "Type",
      items: Object.entries(variants).map(([label, count]) => ({
        id: label.toLowerCase(),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
      })),
    },
    {
      id: "year",
      label: "Year",
      items: Object.entries(years).map(([label, count]) => ({
        id: label.toLowerCase(),
        label,
        count,
      })),
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
      (filter) => filter.id === "category",
    )
    if (
      categoryFilter &&
      !categoryFilter.items.some(
        (filterItem) => filterItem.id === item.category.toLowerCase(),
      )
    ) {
      return false
    }

    // Step 3: Remove items that do not match the applied variant filters
    const variantFilter = appliedFilters.find(
      (filter) => filter.id === "variant",
    )
    if (
      variantFilter &&
      !variantFilter.items.some(
        (filterItem) => filterItem.id === item.variant.toLowerCase(),
      )
    ) {
      return false
    }

    // Step 4: Remove items that do not match the applied year filters
    const yearFilter = appliedFilters.find((filter) => filter.id === "year")
    if (
      yearFilter &&
      !yearFilter.items.some(
        (filterItem) =>
          item.lastUpdated &&
          new Date(item.lastUpdated).getFullYear().toString() === filterItem.id,
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
  if (filterIndex > -1) {
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
