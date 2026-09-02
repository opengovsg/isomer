import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import {
  DEFAULT_DATE_RANGE_FILTER_LABEL,
  TAG_CATEGORY_TYPE,
  type DateFilterStatusId,
} from "~/types/constants"
import { isDateFilter } from "~/types/page"

import type { Filter } from "../../../types/Filter"
import { getDateFilterStatus, getTodayInSingapore } from "./getDateFilterStatus"

// Parallel to getYearFilter/getTagFilters, but for date-type `tagCategories`
// entries: unlike text filters (whose options are admin-defined and
// discovered from items), a date filter's 3 status buckets are fixed and
// known upfront from `statusLabels` — no need to scan items to discover
// distinct values, only to count how many currently fall in each bucket.
export const getDateFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
  today: string = getTodayInSingapore(),
): Filter[] => {
  if (!tagCategories) {
    return []
  }

  const dateCategories = tagCategories.filter(isDateFilter)

  return dateCategories.map((category) => {
    const counts = new Map<string, number>()

    items.forEach((item) => {
      const value = item.dateTagged?.find(({ id }) => id === category.id)
      if (value) {
        const status = getDateFilterStatus(value, today)
        counts.set(status, (counts.get(status) ?? 0) + 1)
      }
    })

    return {
      id: category.id,
      label: category.label,
      type: TAG_CATEGORY_TYPE.Date,
      dateRangeFilterLabel:
        category.dateRangeFilterLabel ?? DEFAULT_DATE_RANGE_FILTER_LABEL,
      items: (
        Object.entries(category.statusLabels) as [DateFilterStatusId, string][]
      )
        .filter(([, label]) => label.trim() !== "")
        .map(([id, label]) => ({
          id,
          label,
          count: counts.get(id) ?? 0,
        }))
        .filter((item) => item.count >= 1),
    }
  })
}
