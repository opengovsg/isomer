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
  const filtersById = new Map(
    [...tagFilters, ...dateFilters].map((filter) => [filter.id, filter]),
  )

  const orderedCategoryFilters = tagCategories?.length
    ? tagCategories
        .map((category) =>
          filtersById.get(
            isDateFilter(category) ? category.id : category.label,
          ),
        )
        .filter((filter): filter is Filter => filter !== undefined)
    : [...tagFilters, ...dateFilters]

  // TODO: Allow user to pass in order of filters to be shown
  return [...orderedCategoryFilters, getYearFilter(items)].filter(
    (filter) => filter.items.length >= 1,
  )
}
