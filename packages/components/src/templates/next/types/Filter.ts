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

interface AppliedFilterUrlJsonObject {
  [key: string]: AppliedFilterUrlJson
}

export type AppliedFilterUrlJson =
  | string
  | number
  | boolean
  | null
  | AppliedFilterUrlJson[]
  | AppliedFilterUrlJsonObject

const isPlainObject = (
  value: AppliedFilterUrlJson,
): value is AppliedFilterUrlJsonObject =>
  value !== null && !Array.isArray(value) && Object(value) === value

const isNonEmptyString = (value: AppliedFilterUrlJson): value is string =>
  Object.prototype.toString.call(value) === "[object String]" && value !== ""

// URL query JSON boundary parser
export const isAppliedFilterUrlJson = (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- validates untrusted JSON.parse output
  value: unknown,
): value is AppliedFilterUrlJson => {
  if (
    value === null ||
    Object.prototype.toString.call(value) === "[object String]" ||
    Object.prototype.toString.call(value) === "[object Number]" ||
    Object.prototype.toString.call(value) === "[object Boolean]"
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isAppliedFilterUrlJson)
  }

  if (Object(value) === value && !Array.isArray(value)) {
    // SAFETY: object branch only runs after excluding arrays and primitives
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- validated plain object branch
    return Object.values(value as AppliedFilterUrlJsonObject).every(
      isAppliedFilterUrlJson,
    )
  }

  return false
}

const isAppliedFiltersArray = (value: AppliedFilterUrlJson): boolean =>
  Array.isArray(value) &&
  value.every((filter) => {
    if (!isPlainObject(filter)) {
      return false
    }

    const filterId = filter.id
    const filterItems = filter.items
    if (filterId === undefined || !isNonEmptyString(filterId)) {
      return false
    }
    if (!Array.isArray(filterItems)) {
      return false
    }

    return filterItems.every((item) => {
      if (!isPlainObject(item)) {
        return false
      }
      const itemId = item.id
      return itemId !== undefined && isNonEmptyString(itemId)
    })
  })

export const parseAppliedFilters = (
  value: AppliedFilterUrlJson,
): AppliedFilter[] => {
  if (!isAppliedFiltersArray(value)) {
    return []
  }

  // SAFETY: isAppliedFiltersArray validates the AppliedFilter[] shape at the URL boundary
  // oxlint-disable-next-line anti-slop/no-chained-type-assertions, typescript/no-unsafe-type-assertion -- validated URL JSON maps to AppliedFilter[]
  return value as unknown as AppliedFilter[]
}

export interface FilterProps {
  filters: Filter[]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  handleFilterToggle: (filterId: string, itemId: string) => void
  handleClearFilter: () => void
}
