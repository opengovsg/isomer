"use client"

import { useDeferredValue, useMemo, useState } from "react"

import type { SearchableTableClientProps } from "~/interfaces"
import { MAX_NUMBER_OF_COLUMNS, PAGINATION_MAX_ITEMS } from "./constants"
import { getFilteredItems } from "./getFilteredItems"
import { getPaginatedItems } from "./getPaginatedItems"
import { SearchableTableClientUI } from "./SearchableTableClientUI"

export const SearchableTableClient = ({
  type,
  title,
  headers,
  items,
  site,
  LinkComponent,
  isLoading = false,
  isError = false,
}: SearchableTableClientProps) => {
  const [_search, setSearch] = useState("")
  const search = useDeferredValue(_search)

  const [currPage, setCurrPage] = useState(1)

  const maxNoOfColumns = Math.min(
    headers.length,
    ...items.map((row) => row.row.length),
    MAX_NUMBER_OF_COLUMNS,
  )

  const filteredItems = useMemo(
    () =>
      getFilteredItems({
        items,
        searchValue: search,
      }),
    [items, search],
  )

  const paginatedItems = useMemo(
    () =>
      getPaginatedItems({
        items: filteredItems,
        currPage,
        itemsPerPage: PAGINATION_MAX_ITEMS,
      }),
    [currPage, filteredItems],
  )

  const isInitiallyEmpty = items.length === 0 || maxNoOfColumns === 0
  const isFilteredEmpty = items.length !== 0 && filteredItems.length === 0

  return (
    <SearchableTableClientUI
      type={type}
      title={title}
      headers={headers}
      site={site}
      LinkComponent={LinkComponent}
      isLoading={isLoading}
      isError={isError}
      search={{ input: _search, deferred: search, setSearch }}
      page={{ currPage, setCurrPage }}
      isInitiallyEmpty={isInitiallyEmpty}
      isFilteredEmpty={isFilteredEmpty}
      maxNoOfColumns={maxNoOfColumns}
      paginatedItems={paginatedItems}
      filteredItemsLength={filteredItems.length}
      searchMatchType="partialMatch"
    />
  )
}
