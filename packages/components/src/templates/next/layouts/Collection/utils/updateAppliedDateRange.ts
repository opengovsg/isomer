import type { AppliedFilter } from "../../../types/Filter"

// Parallel to updateAppliedFilters, but for a date filter's `dateRange`
// instead of a bucket-checkbox `items` id — independent of `items`, so
// setting/clearing a range never touches whatever buckets are checked.
export const updateAppliedDateRange = (
  appliedFilters: AppliedFilter[],
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void,
  filterId: string,
  dateRange: AppliedFilter["dateRange"],
) => {
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
