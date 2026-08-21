import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import {
  TAG_CATEGORY_TYPE,
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
} from "~/types/constants"
import { isDateFilter } from "~/types/page"

import type { Filter } from "../../../types/Filter"

// Parallel to getYearFilter/getTagFilters, but for date-type `tagCategories`
// entries: unlike text filters (whose options are admin-defined and
// discovered from items), a date filter's 3 status buckets are fixed and
// known upfront from `statusLabels` — no need to scan items to discover
// distinct values, only to count how many currently fall in each bucket.
export const getDateFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  if (!tagCategories) {
    return []
  }

  const dateCategories = tagCategories.filter(isDateFilter)

  return dateCategories.map((category) => {
    const counts = new Map<string, number>()

    items.forEach((item) => {
      const card = item.dateFilterCards?.find(({ id }) => id === category.id)
      if (card) {
        counts.set(card.status, (counts.get(card.status) ?? 0) + 1)
      }
    })

    return {
      id: category.id,
      label: category.label,
      type: TAG_CATEGORY_TYPE.Date,
      showStatusLabels:
        category.showStatusLabels ??
        DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabels,
      showDateRange:
        category.showDateRange ??
        DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRange,
      items: category.statusLabels
        .map((statusLabel) => ({
          id: statusLabel.id,
          label: statusLabel.label,
          count: counts.get(statusLabel.id) ?? 0,
        }))
        .filter((item) => item.count >= 1),
    }
  })
}
