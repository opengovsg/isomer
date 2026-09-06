import type { ProcessedCollectionCardProps } from "~/interfaces"
import { isEmpty } from "lodash-es"
import { useQueryParams } from "~/hooks/useQueryParams"

import type { AppliedFilter } from "../../types/Filter"
import { isAppliedFilterUrlJson, parseAppliedFilters } from "../../types/Filter"
import { getFilteredItems } from "./utils/getFilteredItems"
import { getPaginatedItems } from "./utils/getPaginatedItems"
import { updateAppliedFilters } from "./utils/updateAppliedFilters"

export const ITEMS_PER_PAGE = 10

export const useCollection = ({
  items,
}: {
  items: ProcessedCollectionCardProps[]
}) => {
  const [queryParams, updateQueryParams] = useQueryParams()

  const currPage = parseInt(queryParams.page || "1", 10)
  const setCurrPage = (page: number) => {
    updateQueryParams({
      newParams: { page: page.toString() },
    })
  }

  const appliedFilters = (() => {
    const filters = queryParams.filters
    if (isEmpty(filters)) {
      return []
    }
    try {
      const parsed: unknown = JSON.parse(filters || "[]")
      if (!isAppliedFilterUrlJson(parsed)) {
        return []
      }
      return parseAppliedFilters(parsed)
    } catch {
      // Malformed URL param (e.g. ?filters=hello) — treat as no filters rather than crashing.
      return []
    }
  })()

  const setAppliedFilters = (filters: AppliedFilter[]) => {
    updateQueryParams({
      newParams: { filters: JSON.stringify(filters), page: "1" },
    })
  }

  const searchValue = queryParams.search || ""
  const handleSearchValueChange = (value: string) => {
    updateQueryParams({
      newParams: { search: value, page: "1" },
    })
  }

  const handleFilterToggle = (id: string, itemId: string) => {
    return updateAppliedFilters(appliedFilters, setAppliedFilters, id, itemId)
  }

  const filteredItems = getFilteredItems(items, appliedFilters, searchValue)
  const paginatedItems = getPaginatedItems(
    filteredItems,
    ITEMS_PER_PAGE,
    currPage,
  )

  const handleClearFilter = () => {
    updateQueryParams({
      newParams: { search: "", filters: "[]", page: "1" },
    })
  }

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
