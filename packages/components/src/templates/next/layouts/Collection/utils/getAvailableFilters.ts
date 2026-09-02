import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { isDateFilter } from "~/types/page"

import type { Filter } from "../../../types/Filter"
import { getDateFilters } from "./getDateFilters"
import { getTodayInSingapore } from "./getDateFilterStatus"
import { getTagFilters } from "./getTagFilters"
import { getYearFilter } from "./getYearFilter"
import { isAvailableFilter } from "./isDateFilterAvailable"

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
  today: string = getTodayInSingapore(),
): Filter[] => {
  const tagFilters = getTagFilters(items, tagCategories)
  const dateFilters = getDateFilters(items, tagCategories, today)

  // NOTE: Year isn't a `tagCategories` entry (it's derived from each item's
  // `date`), so it has no position to respect and always renders last. Text
  // and date filters, however, are both `tagCategories` entries, so they're
  // reassembled here in that array's order instead of being grouped by type.
  if (!tagCategories || tagCategories.length === 0) {
    return [...tagFilters, ...dateFilters, getYearFilter(items)].filter(
      isAvailableFilter,
    )
  }

  const filtersById = new Map<string, Filter>()
  tagFilters.forEach((filter) => filtersById.set(filter.id, filter))
  dateFilters.forEach((filter) => filtersById.set(filter.id, filter))

  const orderedCategoryFilters = tagCategories
    .map((category) =>
      filtersById.get(isDateFilter(category) ? category.id : category.label),
    )
    .filter((filter): filter is Filter => filter !== undefined)

  return [...orderedCategoryFilters, getYearFilter(items)].filter(
    isAvailableFilter,
  )
}
