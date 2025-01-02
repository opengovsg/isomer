import type { Filter } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import { getCategoryFilter } from "./getCategoryFilter"
import { getTagFilters } from "./getTagFilters"
import { getYearFilter } from "./getYearFilter"

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
): Filter[] => {
  return [
    getCategoryFilter(items),
    getYearFilter(items),
    ...getTagFilters(items),
  ].filter((filter) => filter.items.length >= 2)
}
