import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import type { TagCategoryDisplay } from "~/types/constants"
import { parseDate } from "@internationalized/date"

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
  // NOTE: only set for date-type tag-category filters (see getDateFilters) —
  // text-category/year filters omit this. `items` are the fixed status
  // buckets (ended/ongoing/upcoming); the sidebar also renders a date-range
  // control for this filter (see Filter.tsx), whose value lives in
  // `AppliedFilter.dateRange`, not `items`.
  type?: "date"
}

interface AppliedFilterItem {
  id: FilterItem["id"]
}

export interface AppliedFilter {
  id: Filter["id"]
  items: AppliedFilterItem[]
  // NOTE: only meaningful when the filter is date-type. Independent of
  // `items` (the bucket selection) — both apply together (AND'd) when both
  // are set. Dates are "yyyy-MM-dd" strings, same convention as the
  // underlying `dateTagged` schema field.
  dateRange?: { start: string; end: string }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

// Same yyyy-MM-dd strings accepted by `parseDate` / the `dateTagged` schema.
export const isIsoDateString = (value: string): boolean => {
  try {
    parseDate(value)
    return true
  } catch {
    return false
  }
}

const isValidDateRange = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    isIsoDateString(value.start) &&
    isIsoDateString(value.end))

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
  // NOTE: pass `items` + `tagCategories` for live date-filter counts, or
  // pre-built `filters` for Storybook / tests.
  filters?: Filter[]
  items?: ProcessedCollectionCardProps[]
  tagCategories?: CollectionPagePageProps["tagCategories"]
  appliedFilters: AppliedFilter[]
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void
  handleFilterToggle: (filterId: string, itemId: string) => void
  handleDateRangeChange: (
    filterId: string,
    dateRange: AppliedFilter["dateRange"],
  ) => void
  handleClearFilter: () => void
}
