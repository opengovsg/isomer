import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { AppliedFilter } from "../../types/Filter"
import type { CollectionPageSchemaType } from "~/engine"
import type { CollectionCardProps } from "~/interfaces"
import type {
  SortDirection,
  SortKey,
} from "~/interfaces/internal/CollectionSort"
import {
  getAvailableFilters,
  getFilteredItems,
  getPaginatedItems,
  getSortedItems,
  updateAppliedFilters,
} from "./utils"

export const ITEMS_PER_PAGE = 10

interface UseCollectionProps {
  items: CollectionCardProps[]
  page: CollectionPageSchemaType["page"]
}
export const useCollection = ({
  page: { defaultSortBy, defaultSortDirection },
  items,
}: UseCollectionProps) => {
  const [sortBy, setSortBy] = useState<SortKey>(defaultSortBy)
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection)
  const [appliedFilters, _setAppliedFilters] = useState<AppliedFilter[]>([])
  const [searchValue, _setSearchValue] = useState<string>("")

  // Filter items based on applied filters and search value
  const [filteredItems, setFilteredItems] = useState(
    getSortedItems(
      getFilteredItems(items, appliedFilters, searchValue),
      sortBy,
      sortDirection,
    ),
  )
  const [currPage, setCurrPage] = useState<number>(1)

  const handleSearchValueChange = useCallback(
    (value: string) => {
      _setSearchValue(value)
      startTransition(() => {
        setFilteredItems(
          getSortedItems(
            getFilteredItems(items, appliedFilters, value),
            sortBy,
            sortDirection,
          ),
        )
        setCurrPage(1)
      })
    },
    [appliedFilters, items, sortBy, sortDirection],
  )

  const handleAppliedFiltersChange = useCallback(
    (id: string, itemId: string) => {
      return updateAppliedFilters(
        appliedFilters,
        _setAppliedFilters,
        id,
        itemId,
      )
    },
    [appliedFilters],
  )

  // Update filtered items when applied filters change
  useEffect(() => {
    startTransition(() => {
      setFilteredItems(
        getSortedItems(
          getFilteredItems(items, appliedFilters, searchValue),
          sortBy,
          sortDirection,
        ),
      )
    })
  }, [appliedFilters, items, searchValue, sortBy, sortDirection])

  // Reset current page when filtered items change
  useEffect(() => {
    setCurrPage(1)
  }, [filteredItems])

  const filters = useMemo(() => getAvailableFilters(items), [items])

  const paginatedItems = useMemo(
    () => getPaginatedItems(filteredItems, ITEMS_PER_PAGE, currPage),
    [currPage, filteredItems],
  )

  const handleClearFilter = useCallback(() => {
    handleSearchValueChange("")
    _setAppliedFilters([])
  }, [handleSearchValueChange])

  return {
    paginatedItems,
    filteredCount: filteredItems.length,
    filters,
    searchValue,
    handleSearchValueChange,
    handleClearFilter,
    appliedFilters,
    handleAppliedFiltersChange,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currPage,
    setCurrPage,
  }
}
