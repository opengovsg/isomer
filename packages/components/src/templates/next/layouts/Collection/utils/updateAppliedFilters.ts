import type { AppliedFilter } from "../../../types/Filter"

// Date filters may hold status buckets (items) and/or a custom range; drop only when both are cleared.
const isEmptyAppliedFilter = (filter: AppliedFilter) =>
  filter.items.length === 0 && !filter.dateRange

/** Toggle a checkbox or status bucket on/off for a filter. */
export const toggleAppliedFilterItem = ({
  appliedFilters,
  setAppliedFilters,
  filterId,
  itemId,
}: {
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  filterId: string
  itemId: string
}) => {
  // Step 1: Locate the applied filter for this category.
  const filterIndex = appliedFilters.findIndex(
    (filter) => filter.id === filterId,
  )

  // Step 2: First selection — create a new applied filter.
  if (filterIndex === -1) {
    setAppliedFilters([
      ...appliedFilters,
      { id: filterId, items: [{ id: itemId }] },
    ])
    return
  }

  const existing = appliedFilters[filterIndex]!
  const itemIndex = existing.items.findIndex((item) => item.id === itemId)

  // Step 3: Item already selected — remove it.
  if (itemIndex > -1) {
    const updatedFilter: AppliedFilter = {
      ...existing,
      items: existing.items.filter((item) => item.id !== itemId),
    }

    // Step 4: Drop the filter entirely if nothing remains.
    setAppliedFilters(
      isEmptyAppliedFilter(updatedFilter)
        ? appliedFilters.filter((_, index) => index !== filterIndex)
        : appliedFilters.map((filter, index) =>
            index === filterIndex ? updatedFilter : filter,
          ),
    )
    return
  }

  // Step 3 (alt): Item not yet selected — add it.
  setAppliedFilters(
    appliedFilters.map((filter, index) =>
      index === filterIndex
        ? { ...existing, items: [...existing.items, { id: itemId }] }
        : filter,
    ),
  )
}

/** Set or clear a date filter's custom range; buckets are unchanged. */
export const updateAppliedFilterDateRange = ({
  appliedFilters,
  setAppliedFilters,
  filterId,
  dateRange,
}: {
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  filterId: string
  dateRange?: AppliedFilter["dateRange"]
}) => {
  // Step 1: Locate the applied filter for this category.
  const filterIndex = appliedFilters.findIndex(
    (filter) => filter.id === filterId,
  )

  // Step 2: No existing filter — create one if a range was set.
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

  // Step 3: Merge the new range onto the existing filter (buckets unchanged).
  const existing = appliedFilters[filterIndex]!
  const updatedFilter: AppliedFilter = { ...existing, dateRange }

  // Step 4: Drop the filter entirely if nothing remains.
  setAppliedFilters(
    isEmptyAppliedFilter(updatedFilter)
      ? appliedFilters.filter((_, index) => index !== filterIndex)
      : appliedFilters.map((filter, index) =>
          index === filterIndex ? updatedFilter : filter,
        ),
  )
}
