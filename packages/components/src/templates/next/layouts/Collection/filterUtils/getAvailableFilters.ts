import type { Filter } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import { getCategoryFilter } from "./getCategoryFilter"
import { getTagFilters } from "./getTagFilters"
import { getYearFilter } from "./getYearFilter"

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
): Filter[] => {
  // TODO: Allow user to pass in order of filters to be shown
  return [
    ...getTagFilters(items),
    getCategoryFilter(items),
    getYearFilter(items),
  ].filter((filter) => filter.items.length >= 2)
}
