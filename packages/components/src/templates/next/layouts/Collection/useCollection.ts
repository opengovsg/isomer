import { useCallback, useMemo } from "react"
import isEmpty from "lodash/isEmpty"

import type { AppliedFilter } from "../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import { useQueryParams } from "~/hooks/useQueryParams"
import {
  getFilteredItems,
  getPaginatedItems,
  updateAppliedFilters,
} from "./utils"

export const ITEMS_PER_PAGE = 10

export const useCollection = ({
  items,
}: {
  items: ProcessedCollectionCardProps[]
}) => {
  const [queryParams, updateQueryParams] = useQueryParams()

  const currPage = useMemo(
    () => parseInt(queryParams.page || "1", 10),
    [queryParams.page],
  )
  const setCurrPage = useCallback(
    (page: number) => {
      updateQueryParams({
        oldParams: queryParams,
        newParams: { page: page.toString() },
      })
    },
    [queryParams, updateQueryParams],
  )

  const appliedFilters = useMemo(() => {
    const filters = queryParams.filters
    if (isEmpty(filters)) {
      return []
    }
    return JSON.parse(filters || "[]") as AppliedFilter[]
  }, [queryParams.filters])
  const setAppliedFilters = useCallback(
    (filters: AppliedFilter[]) => {
      updateQueryParams({
        oldParams: queryParams,
        newParams: { filters: JSON.stringify(filters), page: "1" },
      })
    },
    [queryParams, updateQueryParams],
  )

  const searchValue = useMemo(
    () => queryParams.search || "",
    [queryParams.search],
  )
  const handleSearchValueChange = useCallback(
    (value: string) => {
      updateQueryParams({
        oldParams: queryParams,
        newParams: { search: value, page: "1" },
      })
    },
    [queryParams, updateQueryParams],
  )

  const handleFilterToggle = useCallback(
    (id: string, itemId: string) => {
      return updateAppliedFilters(appliedFilters, setAppliedFilters, id, itemId)
    },
    [appliedFilters, setAppliedFilters],
  )

  const filteredItems = getFilteredItems(items, appliedFilters, searchValue)
  const paginatedItems = useMemo(
    () => getPaginatedItems(filteredItems, ITEMS_PER_PAGE, currPage),
    [currPage, filteredItems],
  )

  const handleClearFilter = useCallback(() => {
    handleSearchValueChange("")
    setAppliedFilters([])
  }, [handleSearchValueChange, setAppliedFilters])

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
