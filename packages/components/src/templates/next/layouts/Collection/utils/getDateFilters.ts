import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { getDateFilterStatus } from "~/templates/next/components/internal/CollectionCard/utils/getDateFilterStatus"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"
import { isDateFilter } from "~/types/page"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import type { Filter } from "../../../types/Filter"

export const getDateFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
  today: string = getSingaporeDateYYYYMMDD(),
): Filter[] => {
  if (!tagCategories) {
    return []
  }

  return tagCategories.filter(isDateFilter).map((category) => {
    const counts = new Map<string, number>()

    items.forEach((item) => {
      const value = item.dateTagged?.find(({ id }) => id === category.id)
      if (value) {
        const status = getDateFilterStatus({ ...value, today })
        counts.set(status, (counts.get(status) ?? 0) + 1)
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
      items: Object.values(DATE_FILTER_STATUS).flatMap(
        ({ id, defaultLabel }) => {
          const label = category.statusLabels?.[id] ?? defaultLabel
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
