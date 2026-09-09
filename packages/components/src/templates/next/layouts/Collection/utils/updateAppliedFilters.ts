import type { AppliedFilter } from "../../../types/Filter"

export const updateAppliedFilters = (
  appliedFilters: AppliedFilter[],
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void,
  filterId: string,
  itemIdOrDateRange?: string | AppliedFilter["dateRange"],
) => {
  if (typeof itemIdOrDateRange === "string") {
    const itemId = itemIdOrDateRange
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

        if (
          newAppliedFilters[filterIndex]?.items.length === 0 &&
          !newAppliedFilters[filterIndex]?.dateRange
        ) {
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
    return
  }

  const dateRange = itemIdOrDateRange
  const filterIndex = appliedFilters.findIndex(
    (filter) => filter.id === filterId,
  )

  if (filterIndex === -1) {
    if (!dateRange) {
      return
    }
    setAppliedFilters([
      ...appliedFilters,
      { id: filterId, items: [], dateRange },
    ])
    return
  }

  const newAppliedFilters = [...appliedFilters]
  const existing = newAppliedFilters[filterIndex]

  if (!dateRange && (existing?.items.length ?? 0) === 0) {
    newAppliedFilters.splice(filterIndex, 1)
  } else if (existing) {
    newAppliedFilters[filterIndex] = { ...existing, dateRange }
  }

  setAppliedFilters(newAppliedFilters)
}
