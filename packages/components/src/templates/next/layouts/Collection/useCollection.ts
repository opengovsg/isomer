import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { AppliedFilter } from "../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
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
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [searchValue, _setSearchValue] = useState<string>("")

  // Filter items based on applied filters and search value
  const [filteredItems, setFilteredItems] = useState(
    getFilteredItems(items, appliedFilters, searchValue),
  )
  const [currPage, setCurrPage] = useState<number>(1)

  const handleSearchValueChange = useCallback(
    (value: string) => {
      _setSearchValue(value)
      startTransition(() => {
        setFilteredItems(getFilteredItems(items, appliedFilters, value))
        setCurrPage(1)
      })
    },
    [appliedFilters, items],
  )

  const handleFilterToggle = useCallback(
    (id: string, itemId: string) => {
      return updateAppliedFilters(appliedFilters, setAppliedFilters, id, itemId)
    },
    [appliedFilters],
  )

  // Update filtered items when applied filters change
  useEffect(() => {
    startTransition(() => {
      setFilteredItems(getFilteredItems(items, appliedFilters, searchValue))
    })
  }, [appliedFilters, items, searchValue])

  // Reset current page when filtered items change
  useEffect(() => {
    setCurrPage(1)
  }, [filteredItems])

  const paginatedItems = useMemo(
    () => getPaginatedItems(filteredItems, ITEMS_PER_PAGE, currPage),
    [currPage, filteredItems],
  )

  const handleClearFilter = useCallback(() => {
    handleSearchValueChange("")
    setAppliedFilters([])
  }, [handleSearchValueChange])

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
