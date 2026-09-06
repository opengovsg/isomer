import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"

import type { Filter } from "../../../types/Filter"
import { getTagFilters } from "./getTagFilters"
import { getYearFilter } from "./getYearFilter"

export const getAvailableFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] =>
  // NOTE: Allow user to pass in order of filters to be shown
  [...getTagFilters(items, tagCategories), getYearFilter(items)].filter(
    (filter) => filter.items.length >= 1,
  )
