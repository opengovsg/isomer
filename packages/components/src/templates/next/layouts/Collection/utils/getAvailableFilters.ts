import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { isDateFilter } from "~/types/page"

import type { Filter } from "../../../types/Filter"
import { getDateFilters } from "./getDateFilters"
import { getTagFilters } from "./getTagFilters"
import { getYearFilter } from "./getYearFilter"

type TagCategory = NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
>[number]

// Tag filters use category.label as filter.id; date filters use category.id.
const filterLookupKey = (category: TagCategory) =>
  isDateFilter(category) ? category.id : category.label

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  const categoryFilters = [
    ...getTagFilters(items, tagCategories),
    ...getDateFilters(items, tagCategories),
  ]

  const filtersByLookupKey = new Map(
    categoryFilters.map((filter) => [filter.id, filter]),
  )

  const orderedCategoryFilters = tagCategories?.length
    ? tagCategories
        .map((category) => filtersByLookupKey.get(filterLookupKey(category)))
        .filter((filter): filter is Filter => filter !== undefined)
    : categoryFilters

  // TODO: Allow user to pass in order of filters to be shown
  return [...orderedCategoryFilters, getYearFilter(items)].filter(
    (filter) => filter.items.length >= 1,
  )
}
