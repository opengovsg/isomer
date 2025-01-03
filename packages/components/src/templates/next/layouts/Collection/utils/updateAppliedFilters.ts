import type { AppliedFilter } from "../../../types/Filter"

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
