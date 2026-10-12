import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"
import { isDateFilter } from "~/types/page"

import type { Filter } from "../../../types/Filter"
import { getDateFilterStatus } from "./getDateFilterStatus"

export const getDateFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  if (!tagCategories) {
    return []
  }

  return tagCategories.filter(isDateFilter).map((category) => {
    const counts = new Map<string, number>()
    let dateTaggedItemCount = 0

    items.forEach((item) => {
      const value = item.dateTagged?.find(({ id }) => id === category.id)
      if (value) {
        dateTaggedItemCount++
        const status = getDateFilterStatus(value)
        counts.set(status, (counts.get(status) ?? 0) + 1)
      }
    })

    return {
      id: category.id,
      label: category.label,
      type: TAG_CATEGORY_TYPE.Date,
      showStatusLabelsFilter:
        category.showStatusLabelsFilter ??
        DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabelsFilter,
      showDateRangeFilter:
        category.showDateRangeFilter ??
        DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRangeFilter,
      dateTaggedItemCount,
      items: Object.values(DATE_FILTER_STATUS).flatMap(
        ({ id, defaultLabel }) => {
          const label = category.statusLabels[id] ?? defaultLabel
          const count = counts.get(id) ?? 0
          if (label.trim() === "" || count < 1) {
            return []
          }
          return [{ id, label, count }]
        },
      ),
    }
  })
}
