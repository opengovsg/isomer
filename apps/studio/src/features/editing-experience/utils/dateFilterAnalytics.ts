import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  DateFilterSchemaType,
  DateFilterStatusId,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import {
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  ISOMER_USABLE_PAGE_LAYOUTS,
  isDateFilter,
} from "@opengovsg/isomer-components"

import type { CollectionTags } from "../hooks/useCollectionTags"

// Collection `sortOrder` for a date filter, `date-filter-{uuid}-asc|desc`.
// Same shape as DATE_FILTER_SORT_ORDER_REGEX in isomer-components, which is
// not part of the package's public exports. Capture group 1 is asc or desc.
const DATE_FILTER_SORT_ORDER_REGEX =
  /^date-filter-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(asc|desc)$/

export interface DateFilterSavedProperties {
  isRequired: boolean
  showStatusLabelsFilter: boolean
  showDateRangeFilter: boolean
  statusLabelsCustomized: boolean
}

export interface CollectionItemDateProperties {
  datesFilled: number
  dateFilterCount: number
  hasRange: boolean
}

const isStatusLabelsCustomized = (
  statusLabels: DateFilterSchemaType["statusLabels"],
): boolean =>
  (Object.keys(DEFAULT_DATE_FILTER_STATUS_LABELS) as DateFilterStatusId[]).some(
    (id) => {
      const label = statusLabels[id]
      return (
        label !== undefined && label !== DEFAULT_DATE_FILTER_STATUS_LABELS[id]
      )
    },
  )

export const toDateFilterSavedProperties = (
  filter: DateFilterSchemaType,
): DateFilterSavedProperties => ({
  isRequired: filter.isRequired ?? false,
  showStatusLabelsFilter:
    filter.showStatusLabelsFilter ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabelsFilter,
  showDateRangeFilter:
    filter.showDateRangeFilter ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRangeFilter,
  statusLabelsCustomized: isStatusLabelsCustomized(filter.statusLabels),
})

const sameSavedProperties = (
  left: DateFilterSavedProperties,
  right: DateFilterSavedProperties,
): boolean =>
  left.isRequired === right.isRequired &&
  left.showStatusLabelsFilter === right.showStatusLabelsFilter &&
  left.showDateRangeFilter === right.showDateRangeFilter &&
  left.statusLabelsCustomized === right.statusLabelsCustomized

export const listChangedDateFilters = (
  before: CollectionPagePageProps["tagCategories"],
  after: CollectionPagePageProps["tagCategories"],
): DateFilterSavedProperties[] => {
  const previous = new Map(
    (before ?? [])
      .filter(isDateFilter)
      .map((filter) => [filter.id, toDateFilterSavedProperties(filter)]),
  )

  return (after ?? []).filter(isDateFilter).flatMap((filter) => {
    const next = toDateFilterSavedProperties(filter)
    const prev = previous.get(filter.id)
    if (prev && sameSavedProperties(prev, next)) {
      return []
    }
    return [next]
  })
}

export const getCollectionItemDateProperties = (
  tags: CollectionTags,
  dateTagged: ArticlePagePageProps["dateTagged"],
): CollectionItemDateProperties | undefined => {
  const dateFilterIds = new Set(
    tags.filter(isDateFilter).map((filter) => filter.id),
  )
  if (dateFilterIds.size === 0) {
    return undefined
  }

  const filled = (dateTagged ?? []).filter(
    (entry) => dateFilterIds.has(entry.id) && entry.date,
  )

  return {
    datesFilled: filled.length,
    dateFilterCount: dateFilterIds.size,
    hasRange: filled.some((entry) => Boolean(entry.endDate)),
  }
}

export const getChangedDateFilterSortDirection = (
  before: string | undefined,
  after: string | undefined,
): "asc" | "desc" | undefined => {
  if (!after || before === after) {
    return undefined
  }

  const direction = DATE_FILTER_SORT_ORDER_REGEX.exec(after)?.[1]
  if (direction === "asc" || direction === "desc") {
    return direction
  }

  return undefined
}

export const getCollectionPage = (
  state: IsomerSchema,
): CollectionPagePageProps | undefined => {
  if (state.layout !== ISOMER_USABLE_PAGE_LAYOUTS.Collection) {
    return undefined
  }

  return state.page as CollectionPagePageProps
}
