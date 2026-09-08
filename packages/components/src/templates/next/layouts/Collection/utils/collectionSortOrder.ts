import type { CollectionPagePageProps } from "~/types/page"
import { isDateFilter } from "~/types/page"

const DEFAULT_COLLECTION_SORT_ORDER = "date-desc"
const DATE_FILTER_SORT_ORDER_PREFIX = "date-filter-"

type CollectionSortDirection = "asc" | "desc"

type ParsedCollectionSortOrder =
  | { kind: "date"; direction: CollectionSortDirection }
  | { kind: "title"; direction: CollectionSortDirection }
  | {
      kind: "date-filter"
      filterId: string
      direction: CollectionSortDirection
    }

const BASE_COLLECTION_SORT_OPTIONS = [
  {
    value: "date-desc",
    label: "By item date, newest → oldest",
  },
  {
    value: "date-asc",
    label: "By item date, oldest → newest",
  },
  {
    value: "title-asc",
    label: "By title, A → Z",
  },
  {
    value: "title-desc",
    label: "By title, Z → A",
  },
] as const

const encodeDateFilterSortOrder = (
  filterId: string,
  direction: CollectionSortDirection,
): string => `${DATE_FILTER_SORT_ORDER_PREFIX}${filterId}-${direction}`

const parseCollectionSortOrder = (
  sortOrder: string | undefined,
): ParsedCollectionSortOrder => {
  if (!sortOrder) {
    return { kind: "date", direction: "desc" }
  }

  if (sortOrder.startsWith(DATE_FILTER_SORT_ORDER_PREFIX)) {
    const direction: CollectionSortDirection = sortOrder.endsWith("-asc")
      ? "asc"
      : "desc"
    const filterId = sortOrder.slice(
      DATE_FILTER_SORT_ORDER_PREFIX.length,
      sortOrder.length - `-${direction}`.length,
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

const isBaseCollectionSortOrder = (
  sortOrder: string,
): sortOrder is (typeof BASE_COLLECTION_SORT_OPTIONS)[number]["value"] =>
  BASE_COLLECTION_SORT_OPTIONS.some(({ value }) => value === sortOrder)

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

  if (isBaseCollectionSortOrder(sortOrder)) {
    return sortOrder
  }

  const parsed = parseCollectionSortOrder(sortOrder)
  if (parsed.kind !== "date-filter") {
    return DEFAULT_COLLECTION_SORT_ORDER
  }

  const filterExists = tagCategories
    ?.filter(isDateFilter)
    .some(({ id }) => id === parsed.filterId)

  return filterExists ? sortOrder : DEFAULT_COLLECTION_SORT_ORDER
}

export { parseCollectionSortOrder }
