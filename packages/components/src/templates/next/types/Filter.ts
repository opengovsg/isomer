export interface FilterItem {
  id: string
  label: string
  count: number
}

export interface Filter {
  id: string
  label: string
  items: FilterItem[]
}

interface AppliedFilterItem {
  id: FilterItem["id"]
}

export interface AppliedFiltersWithLabel {
  appliedFilterTypeId: Filter["id"]
  appliedFilterId: FilterItem["id"]
  label: FilterItem["label"]
}

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
}

export interface FilterProps {
  filters: Filter[]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  handleFilterToggle: (filterId: string, itemId: string) => void
  handleClearFilter: () => void
}

export default FilterProps
