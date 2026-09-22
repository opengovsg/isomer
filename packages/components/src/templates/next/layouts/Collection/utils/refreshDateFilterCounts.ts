import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { TAG_CATEGORY_TYPE } from "~/types/constants"

import type { Filter } from "../../../types/Filter"
import { getDateFilters } from "./getDateFilters"

const isSameFilter = (left: Filter, right: Filter): boolean => {
  if (
    left.id !== right.id ||
    left.label !== right.label ||
    left.type !== right.type ||
    left.items.length !== right.items.length
  ) {
    return false
  }

  return left.items.every((item, index) => {
    const other = right.items[index]
    return (
      other !== undefined &&
      item.id === other.id &&
      item.label === other.label &&
      item.count === other.count
    )
  })
}

export const areCollectionFiltersEqual = (
  left: Filter[],
  right: Filter[],
): boolean =>
  left.length === right.length &&
  left.every((filter, index) => {
    const other = right[index]
    return (
      other !== undefined && (filter === other || isSameFilter(filter, other))
    )
  })

// Tag and year filters are precomputed with the page. Date-bucket counts are
// not: they depend on Singapore "today", which moves after publish. Replace
// only those counts from the items already on the client.
export const refreshDateFilterCounts = (
  filters: Filter[],
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  const dateFiltersById = new Map(
    getDateFilters(items, tagCategories).map((filter) => [filter.id, filter]),
  )

  return filters.flatMap((filter) => {
    if (filter.type !== TAG_CATEGORY_TYPE.Date) {
      return [filter]
    }

    const fresh = dateFiltersById.get(filter.id)
    if (!fresh || fresh.items.length < 1) {
      return []
    }

    return [fresh]
  })
}
