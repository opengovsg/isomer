import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { isEmpty } from "lodash-es"
import { useCallback, useMemo } from "react"
import { useQueryParams } from "~/hooks/useQueryParams"

import type { AppliedFilter } from "../../types/Filter"
import { isAppliedFilters } from "../../types/Filter"
import {
  getFilteredItems,
  getPaginatedItems,
  sanitizeAppliedFiltersForVisibility,
  toggleAppliedFilterItem,
} from "./utils"

export const ITEMS_PER_PAGE = 10

export const useCollection = ({
  items,
  tagCategories,
}: {
  items: ProcessedCollectionCardProps[]
  tagCategories?: CollectionPagePageProps["tagCategories"]
}) => {
  const [queryParams, updateQueryParams] = useQueryParams()

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
      if (!isAppliedFilters(parsed)) {
        return []
      }
      return sanitizeAppliedFiltersForVisibility(parsed, tagCategories)
    } catch {
      // Malformed URL param (e.g. ?filters=hello) — treat as no filters rather than crashing.
      return []
    }
  }, [queryParams.filters, tagCategories])
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
    appliedFilters,
    handleFilterToggle,
    setAppliedFilters,
    currPage,
    setCurrPage,
  }
}

export type UseCollectionReturn = ReturnType<typeof useCollection>
