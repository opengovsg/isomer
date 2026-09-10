import type { CollectionPagePageProps } from "~/types/page"
import {
  COLLECTION_SORT_ORDER,
  DEFAULT_COLLECTION_SORT_ORDER,
  type CollectionSortOrder,
} from "~/types/constants"
import { isDateFilter } from "~/types/page"
import { COLLECTION_SORT_ORDER_PATTERN } from "~/utils/validation"

const COLLECTION_SORT_ORDER_REGEX = new RegExp(COLLECTION_SORT_ORDER_PATTERN)
const DATE_FILTER_SORT_ORDER_REGEX =
  /^date-filter-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(asc|desc)$/
const BASE_COLLECTION_SORT_ORDERS = new Set<string>(
  Object.values(COLLECTION_SORT_ORDER),
)

type CollectionSortDirection = "asc" | "desc"

type ParsedCollectionSortOrder =
  | { kind: "date"; direction: CollectionSortDirection }
  | { kind: "title"; direction: CollectionSortDirection }
  | {
      kind: "date-filter"
      filterId: string
      direction: CollectionSortDirection
    }

const DEFAULT_PARSED_COLLECTION_SORT_ORDER: ParsedCollectionSortOrder = {
  kind: "date",
  direction: "desc",
}

const isBaseCollectionSortOrder = (
  sortOrder: string,
): sortOrder is CollectionSortOrder =>
  BASE_COLLECTION_SORT_ORDERS.has(sortOrder)

const getDateFilters = (
  tagCategories: CollectionPagePageProps["tagCategories"],
) => (Array.isArray(tagCategories) ? tagCategories.filter(isDateFilter) : [])

export const parseCollectionSortOrder = (
  sortOrder: string | undefined,
): ParsedCollectionSortOrder => {
  if (!sortOrder || !COLLECTION_SORT_ORDER_REGEX.test(sortOrder)) {
    return DEFAULT_PARSED_COLLECTION_SORT_ORDER
  }

  const dateFilterMatch = DATE_FILTER_SORT_ORDER_REGEX.exec(sortOrder)
  const filterId = dateFilterMatch?.[1]
  const dateFilterDirection = dateFilterMatch?.[2]
  if (
    filterId &&
    (dateFilterDirection === "asc" || dateFilterDirection === "desc")
  ) {
    return {
      kind: "date-filter",
      filterId,
      direction: dateFilterDirection,
    }
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

export const resolveCollectionSortOrder = (
  sortOrder: string | undefined,
  tagCategories?: CollectionPagePageProps["tagCategories"],
): string => {
  if (!sortOrder || !COLLECTION_SORT_ORDER_REGEX.test(sortOrder)) {
    return DEFAULT_COLLECTION_SORT_ORDER
  }

  if (isBaseCollectionSortOrder(sortOrder)) {
    return sortOrder
  }

  const parsed = parseCollectionSortOrder(sortOrder)
  if (parsed.kind !== "date-filter") {
    return DEFAULT_COLLECTION_SORT_ORDER
  }

  const filterExists = getDateFilters(tagCategories).some(
    ({ id }) => id === parsed.filterId,
  )

  return filterExists ? sortOrder : DEFAULT_COLLECTION_SORT_ORDER
}
