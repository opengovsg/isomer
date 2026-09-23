import {
  COLLECTION_SORT_ORDER,
  isDateFilter,
} from "@opengovsg/isomer-components"

import type { CollectionTags } from "../hooks/useCollectionTags"

const BASE_COLLECTION_SORT_OPTIONS = [
  {
    value: COLLECTION_SORT_ORDER.DateDesc,
    label: "By article date, newest → oldest",
  },
  {
    value: COLLECTION_SORT_ORDER.DateAsc,
    label: "By article date, oldest → newest",
  },
  {
    value: COLLECTION_SORT_ORDER.TitleAsc,
    label: "By title, A → Z",
  },
  {
    value: COLLECTION_SORT_ORDER.TitleDesc,
    label: "By title, Z → A",
  },
] as const

// Must match `COLLECTION_SORT_ORDER_PATTERN` in isomer-components:
// `date-filter-{uuid}-asc|desc`
const encodeDateFilterSortOrder = (
  filterId: string,
  direction: "asc" | "desc",
): string => `date-filter-${filterId}-${direction}`

export const getCollectionSortOptions = (
  tagCategories: CollectionTags = [],
): { value: string; label: string }[] => {
  const dateFilterOptions = tagCategories
    .filter(isDateFilter)
    .flatMap((filter) => [
      {
        value: encodeDateFilterSortOrder(filter.id, "desc"),
        label: `By ${filter.label}, newest → oldest`,
      },
      {
        value: encodeDateFilterSortOrder(filter.id, "asc"),
        label: `By ${filter.label}, oldest → newest`,
      },
    ])

  return [...BASE_COLLECTION_SORT_OPTIONS, ...dateFilterOptions]
}
