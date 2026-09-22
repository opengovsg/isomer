import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { isEmpty } from "lodash-es"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryParams } from "~/hooks/useQueryParams"

import type { AppliedFilter, Filter } from "../../types/Filter"
import { isAppliedFilters } from "../../types/Filter"
import {
  getFilteredItems,
  getPaginatedItems,
  toggleAppliedFilterItem,
} from "./utils"
import {
  areCollectionFiltersEqual,
  refreshDateFilterCounts,
} from "./utils/refreshDateFilterCounts"

const EMPTY_FILTERS: Filter[] = []

export const ITEMS_PER_PAGE = 10

export const useCollection = ({
  items,
  tagCategories,
  filters = EMPTY_FILTERS,
}: {
  items: ProcessedCollectionCardProps[]
  tagCategories?: CollectionPagePageProps["tagCategories"]
  // Precomputed sidebar. Date-bucket counts in it are from publish time.
  filters?: Filter[]
}) => {
  const [queryParams, updateQueryParams] = useQueryParams()

  const [availableFilters, setAvailableFilters] = useState(filters)

  // Once on load (and if this page's items or filters change). Not on a timer:
  // tag and year filters stay precomputed; only date-bucket counts are refreshed.
  useEffect(() => {
    const next = refreshDateFilterCounts(filters, items, tagCategories)
    setAvailableFilters((current) =>
      areCollectionFiltersEqual(current, next) ? current : next,
    )
  }, [filters, items, tagCategories])

  const currPage = useMemo(
    () => parseInt(queryParams.page || "1", 10),
    [queryParams.page],
  )
  const setCurrPage = useCallback(
    (page: number) => {
      updateQueryParams({
        newParams: { page: page.toString() },
      })
    },
    [updateQueryParams],
  )

  const appliedFilters = useMemo(() => {
    const filters = queryParams.filters
    if (isEmpty(filters)) {
      return []
    }
    try {
      const parsed: unknown = JSON.parse(filters || "[]")
      return isAppliedFilters(parsed) ? parsed : []
    } catch {
      // Malformed URL param (e.g. ?filters=hello) — treat as no filters rather than crashing.
      return []
    }
  }, [queryParams.filters])
  const setAppliedFilters = useCallback(
    (filters: AppliedFilter[]) => {
      updateQueryParams({
        newParams: { filters: JSON.stringify(filters), page: "1" },
      })
    },
    [updateQueryParams],
  )

  const searchValue = useMemo(
    () => queryParams.search || "",
    [queryParams.search],
  )
  const handleSearchValueChange = useCallback(
    (value: string) => {
      updateQueryParams({
        newParams: { search: value, page: "1" },
      })
    },
    [updateQueryParams],
  )

  const handleFilterToggle = useCallback(
    (id: string, itemId: string) => {
      return toggleAppliedFilterItem({
        appliedFilters,
        setAppliedFilters,
        filterId: id,
        itemId,
      })
    },
    [appliedFilters, setAppliedFilters],
  )

  const filteredItems = useMemo(
    () => getFilteredItems(items, appliedFilters, searchValue, tagCategories),
    [items, appliedFilters, searchValue, tagCategories],
  )
  const paginatedItems = useMemo(
    () => getPaginatedItems(filteredItems, ITEMS_PER_PAGE, currPage),
    [currPage, filteredItems],
  )

  const handleClearFilter = useCallback(() => {
    updateQueryParams({
      newParams: { search: "", filters: "[]", page: "1" },
    })
  }, [updateQueryParams])

  return {
    paginatedItems,
    filteredCount: filteredItems.length,
    totalCount: items.length,
    searchValue,
    handleSearchValueChange,
    handleClearFilter,
    availableFilters,
    appliedFilters,
    handleFilterToggle,
    setAppliedFilters,
    currPage,
    setCurrPage,
  }
}

export type UseCollectionReturn = ReturnType<typeof useCollection>
