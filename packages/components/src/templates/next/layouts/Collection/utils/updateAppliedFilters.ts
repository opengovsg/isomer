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

  if (filterIndex === -1) {
    setAppliedFilters([
      ...appliedFilters,
      { id: filterId, items: [{ id: itemId }] },
    ])
    return
  }

  const itemIndex = appliedFilters[filterIndex]?.items.findIndex(
    (item) => item.id === itemId,
  )
  const newAppliedFilters = [...appliedFilters]

  if (itemIndex !== undefined && itemIndex > -1) {
    newAppliedFilters[filterIndex]?.items.splice(itemIndex, 1)

    if (newAppliedFilters[filterIndex]?.items.length === 0) {
      newAppliedFilters.splice(filterIndex, 1)
    }
  } else {
    newAppliedFilters[filterIndex]?.items.push({ id: itemId })
  }

  setAppliedFilters(newAppliedFilters)
}
