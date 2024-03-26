interface FilterItem {
  id: string
  label: string
  count?: number
}

interface Filter {
  id: string
  label: string
  items: FilterItem[]
}

interface AppliedFilterItem {
  id: FilterItem["id"]
}

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
}

export interface FilterProps {
  type: "filter"
  filters: Filter[]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (filters: AppliedFilter[]) => void
}

export default FilterProps
