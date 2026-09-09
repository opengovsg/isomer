import type { TagCategoryDisplay, TAG_CATEGORY_TYPE } from "~/types/constants"
import type { DateFilterSidebarVisibility } from "~/types/page"

export interface FilterItem {
  id: string
  label: string
  count: number
}

// TODO: refactor to use type union instead of type property
export interface Filter {
  id: string
  label: string
  items: FilterItem[]
  // NOTE: only set for tag-category filters; category/year filters omit this.
  display?: TagCategoryDisplay
  // NOTE: only set for date-type tag-category filters (see getDateFilters) —
  // text-category/year filters omit this. `items` are the fixed status
  // buckets (ended/ongoing/upcoming); the sidebar also renders a date-range
  // control for this filter (see Filter.tsx), whose value lives in
  // `AppliedFilter.dateRange`, not `items`.
  type?: typeof TAG_CATEGORY_TYPE.Date
  // NOTE: only set for date-type tag-category filters — whether the status-label
  // checkboxes and/or custom date-range input render in the sidebar.
  showStatusLabels?: DateFilterSidebarVisibility["showStatusLabels"]
  showDateRange?: DateFilterSidebarVisibility["showDateRange"]
}

interface AppliedFilterItem {
  id: FilterItem["id"]
}

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
  dateRange?: { start: string; end: string }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

// ISO calendar date (YYYY-MM-DD) from URL-parsed filter JSON. Rejects time and locale formats.
const isIsoDateString = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)

const isValidDateRange = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    isIsoDateString(value.start) &&
    isIsoDateString(value.end) &&
    value.start <= value.end)

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
  handleClearFilter: () => void
}
