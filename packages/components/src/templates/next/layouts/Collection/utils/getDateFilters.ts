import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { getDateFilterStatus } from "~/templates/next/components/internal/CollectionCard/utils/getDateFilterStatus"
import { DATE_FILTER_STATUS, TAG_CATEGORY_TYPE } from "~/types/constants"
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
      items: Object.values(DATE_FILTER_STATUS)
        .map(({ id, defaultLabel }) => ({
          id,
          label: category.statusLabels?.[id] ?? defaultLabel,
        }))
        .filter(({ label }) => label.trim() !== "")
        .map(({ id, label }) => ({
          id,
          label,
          count: counts.get(id) ?? 0,
        }))
        .filter((item) => item.count >= 1),
    }
  })
}
