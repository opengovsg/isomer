import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  DateFilterSchemaType,
  DateFilterStatusId,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import {
  DATE_FILTER_SORT_ORDER_REGEX,
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  DEFAULT_FILTER_IS_REQUIRED,
  ISOMER_USABLE_PAGE_LAYOUTS,
  isDateFilter,
} from "@opengovsg/isomer-components"

import type { CollectionTags } from "../hooks/useCollectionTags"

export type DateFilterSavedProperties = Required<
  Pick<
    DateFilterSchemaType,
    "isRequired" | "showStatusLabelsFilter" | "showDateRangeFilter"
  >
> & {
  statusLabelsCustomized: boolean
}

interface CollectionItemDateProperties {
  datesFilled: number
  dateFilterCount: number
  hasRange: boolean
}

const isStatusLabelsCustomized = ({
  statusLabels,
}: {
  statusLabels: DateFilterSchemaType["statusLabels"]
}): boolean =>
  (Object.keys(DEFAULT_DATE_FILTER_STATUS_LABELS) as DateFilterStatusId[]).some(
    (id) => {
      const label = statusLabels[id]
      return (
        label !== undefined && label !== DEFAULT_DATE_FILTER_STATUS_LABELS[id]
      )
    },
  )

const toDateFilterSavedProperties = ({
  filter,
}: {
  filter: DateFilterSchemaType
}): DateFilterSavedProperties => ({
  isRequired: filter.isRequired ?? DEFAULT_FILTER_IS_REQUIRED,
  showStatusLabelsFilter:
    filter.showStatusLabelsFilter ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabelsFilter,
  showDateRangeFilter:
    filter.showDateRangeFilter ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRangeFilter,
  statusLabelsCustomized: isStatusLabelsCustomized({
    statusLabels: filter.statusLabels,
  }),
})

const sameSavedProperties = ({
  left,
  right,
}: {
  left: DateFilterSavedProperties
  right: DateFilterSavedProperties
}): boolean =>
  left.isRequired === right.isRequired &&
  left.showStatusLabelsFilter === right.showStatusLabelsFilter &&
  left.showDateRangeFilter === right.showDateRangeFilter &&
  left.statusLabelsCustomized === right.statusLabelsCustomized

export const listChangedDateFilters = ({
  before,
  after,
}: {
  before: CollectionPagePageProps["tagCategories"]
  after: CollectionPagePageProps["tagCategories"]
}): DateFilterSavedProperties[] => {
  const previous = new Map(
    (before ?? [])
      .filter(isDateFilter)
      .map((filter) => [filter.id, toDateFilterSavedProperties({ filter })]),
  )

  return (after ?? []).filter(isDateFilter).flatMap((filter) => {
    const next = toDateFilterSavedProperties({ filter })
    const prev = previous.get(filter.id)
    if (prev && sameSavedProperties({ left: prev, right: next })) {
      return []
    }
    return [next]
  })
}

export const getCollectionItemDateProperties = ({
  tags,
  dateTagged,
}: {
  tags: CollectionTags
  dateTagged: ArticlePagePageProps["dateTagged"]
}): CollectionItemDateProperties | undefined => {
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

export const getChangedDateFilterSortDirection = ({
  before,
  after,
}: {
  before: string | undefined
  after: string | undefined
}): "asc" | "desc" | undefined => {
  if (!after || before === after) {
    return undefined
  }

  // Prefix is checked here as well as in DATE_FILTER_SORT_ORDER_REGEX so a
  // looser pattern cannot treat a built-in order like `date-asc` as a date filter.
  if (!after.startsWith("date-filter-")) {
    return undefined
  }

  // Group 2 is asc|desc. Group 1 is the filter uuid.
  const direction = DATE_FILTER_SORT_ORDER_REGEX.exec(after)?.[2]
  if (direction === "asc" || direction === "desc") {
    return direction
  }

  return undefined
}

export const getCollectionPage = ({
  state,
}: {
  state: IsomerSchema
}): CollectionPagePageProps | undefined => {
  if (state.layout !== ISOMER_USABLE_PAGE_LAYOUTS.Collection) {
    return undefined
  }

  return state.page as CollectionPagePageProps
}
