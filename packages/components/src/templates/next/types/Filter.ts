import type { TagCategoryDisplay } from "~/types/constants"

export interface FilterItem {
  id: string
  label: string
  count: number
}

export interface Filter {
  id: string
  label: string
  items: FilterItem[]
  // NOTE: only set for tag-category filters; category/year filters omit this.
  display?: TagCategoryDisplay
}

interface AppliedFilterItem {
  id: FilterItem["id"]
}

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
}

type AppliedFilterUrlJson =
  | string
  | number
  | boolean
  | null
  | AppliedFilterUrlJson[]
  | { [key: string]: AppliedFilterUrlJson }

interface UntrustedAppliedFilterCandidate {
  id?: AppliedFilterUrlJson
  items?: AppliedFilterUrlJson
}

const isPlainObject = (
  value: AppliedFilterUrlJson,
): value is UntrustedAppliedFilterCandidate =>
  value !== null && !Array.isArray(value) && Object(value) === value

const isNonEmptyString = (value: AppliedFilterUrlJson): value is string =>
  Object.prototype.toString.call(value) === "[object String]" && value !== ""

export const isAppliedFilters = (
  value: AppliedFilterUrlJson,
): value is AppliedFilter[] =>
  Array.isArray(value) &&
  value.every(
    (filter) =>
      isPlainObject(filter) &&
      isNonEmptyString(filter.id) &&
      Array.isArray(filter.items) &&
      filter.items.every((item) => {
        if (!isPlainObject(item)) return false
        return isNonEmptyString(item.id)
      }),
  )

export interface FilterProps {
  filters: Filter[]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  handleFilterToggle: (filterId: string, itemId: string) => void
  handleClearFilter: () => void
}
