import { z } from "zod"

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

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
}

export const appliedFiltersSchema = z.array(
  z.object({ id: z.string(), items: z.array(z.object({ id: z.string() })) }),
)

export interface FilterProps {
  filters: Filter[]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  handleFilterToggle: (filterId: string, itemId: string) => void
  handleClearFilter: () => void
}
