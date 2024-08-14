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
import {
  getAvailableFilters,
  getFilteredItems,
  getPaginatedItems,
  updateAppliedFilters,
} from "./utils"

export const ITEMS_PER_PAGE = 10

interface UseCollectionProps {
  items: CollectionCardProps[]
}
export const useCollection = ({ items }: UseCollectionProps) => {
  const [appliedFilters, _setAppliedFilters] = useState<AppliedFilter[]>([])
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
      setFilteredItems(getFilteredItems(items, appliedFilters, searchValue))
    })
  }, [appliedFilters, items, searchValue])

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
    currPage,
    setCurrPage,
  }
}
