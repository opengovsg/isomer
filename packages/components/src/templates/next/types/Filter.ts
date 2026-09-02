import { TAG_CATEGORY_TYPE, type TagCategoryDisplay } from "~/types/constants"

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
  // Set only on date-type tag-category filters (see getDateFilters in PR 2).
  // Text filters omit this; resolveTagCategoryType treats missing as text.
  type?: typeof TAG_CATEGORY_TYPE.Date
}

interface AppliedFilterItem {
  id: FilterItem["id"]
}

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
  // Date filters only. AND'd with items when both are set.
  // yyyy-MM-dd, same as dateTagged.
  dateRange?: { start: string; end: string }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isValidDateRange = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    typeof value.start === "string" &&
    typeof value.end === "string")

export const isAppliedFilters = (value: unknown): value is AppliedFilter[] =>
  Array.isArray(value) &&
  value.every(
    (filter) =>
      isRecord(filter) &&
      typeof filter.id === "string" &&
      Array.isArray(filter.items) &&
      filter.items.every(
        (item) => isRecord(item) && typeof item.id === "string",
      ) &&
      isValidDateRange(filter.dateRange),
  )

export interface FilterProps {
  filters: Filter[]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  handleFilterToggle: (filterId: string, itemId: string) => void
  handleDateRangeChange: (
    filterId: string,
    dateRange: AppliedFilter["dateRange"],
  ) => void
  handleClearFilter: () => void
}
