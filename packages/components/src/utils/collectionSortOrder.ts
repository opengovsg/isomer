import type { CollectionPagePageProps } from "~/types/page"
import { isDateFilter } from "~/types/page"

export const BASE_COLLECTION_SORT_ORDERS = {
  dateDesc: "date-desc",
  dateAsc: "date-asc",
  titleAsc: "title-asc",
  titleDesc: "title-desc",
} as const

export type BaseCollectionSortOrder =
  (typeof BASE_COLLECTION_SORT_ORDERS)[keyof typeof BASE_COLLECTION_SORT_ORDERS]

export const DEFAULT_COLLECTION_SORT_ORDER =
  BASE_COLLECTION_SORT_ORDERS.dateDesc

export const DATE_FILTER_SORT_ORDER_PREFIX = "date-filter-"

export type CollectionSortDirection = "asc" | "desc"

export type ParsedCollectionSortOrder =
  | { kind: "date"; direction: CollectionSortDirection }
  | { kind: "title"; direction: CollectionSortDirection }
  | {
      kind: "date-filter"
      filterId: string
      direction: CollectionSortDirection
    }

const BASE_COLLECTION_SORT_OPTIONS: {
  value: BaseCollectionSortOrder
  label: string
}[] = [
  {
    value: BASE_COLLECTION_SORT_ORDERS.dateDesc,
    label: "By article date, newest → oldest",
  },
  {
    value: BASE_COLLECTION_SORT_ORDERS.dateAsc,
    label: "By article date, oldest → newest",
  },
  {
    value: BASE_COLLECTION_SORT_ORDERS.titleAsc,
    label: "By title, A → Z",
  },
  {
    value: BASE_COLLECTION_SORT_ORDERS.titleDesc,
    label: "By title, Z → A",
  },
]

export const encodeDateFilterSortOrder = (
  filterId: string,
  direction: CollectionSortDirection,
): string => `${DATE_FILTER_SORT_ORDER_PREFIX}${filterId}-${direction}`

export const parseCollectionSortOrder = (
  sortOrder: string | undefined,
): ParsedCollectionSortOrder => {
  if (!sortOrder) {
    return { kind: "date", direction: "desc" }
  }

  if (sortOrder.startsWith(DATE_FILTER_SORT_ORDER_PREFIX)) {
    const direction: CollectionSortDirection = sortOrder.endsWith("-asc")
      ? "asc"
      : "desc"
    const directionSuffix = `-${direction}`
    const filterId = sortOrder.slice(
      DATE_FILTER_SORT_ORDER_PREFIX.length,
      sortOrder.length - directionSuffix.length,
    )

    return { kind: "date-filter", filterId, direction }
  }

  const [sortBy, direction] = sortOrder.split("-") as [
    "date" | "title",
    CollectionSortDirection,
  ]

  if (sortBy === "title") {
    return { kind: "title", direction }
  }

  return { kind: "date", direction }
}

export const getCollectionSortOptions = (
  tagCategories?: CollectionPagePageProps["tagCategories"],
): { value: string; label: string }[] => {
  const dateFilterOptions =
    tagCategories?.filter(isDateFilter).flatMap((filter) => [
      {
        value: encodeDateFilterSortOrder(filter.id, "desc"),
        label: `By ${filter.label}, newest → oldest`,
      },
      {
        value: encodeDateFilterSortOrder(filter.id, "asc"),
        label: `By ${filter.label}, oldest → newest`,
      },
    ]) ?? []

  return [...BASE_COLLECTION_SORT_OPTIONS, ...dateFilterOptions]
}

export const resolveCollectionSortOrder = (
  sortOrder: string | undefined,
  tagCategories?: CollectionPagePageProps["tagCategories"],
): string => {
  if (!sortOrder) {
    return DEFAULT_COLLECTION_SORT_ORDER
  }

  const validValues = new Set(
    getCollectionSortOptions(tagCategories).map(({ value }) => value),
  )

  if (!validValues.has(sortOrder)) {
    return DEFAULT_COLLECTION_SORT_ORDER
  }

  return sortOrder
}
