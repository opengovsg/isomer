import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { isDateFilter } from "~/types/page"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import type { Filter } from "../../../types/Filter"
import { getDateFilters } from "./getDateFilters"
import { getTagFilters } from "./getTagFilters"
import { getYearFilter } from "./getYearFilter"

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
  today: string = getSingaporeDateYYYYMMDD(),
): Filter[] => {
  const tagFilters = getTagFilters(items, tagCategories)
  const dateFilters = getDateFilters(items, tagCategories, today)

  if (!tagCategories || tagCategories.length === 0) {
    return [...tagFilters, ...dateFilters, getYearFilter(items)].filter(
      (filter) => filter.items.length >= 1,
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
    (filter) => filter.items.length >= 1,
  )
}
