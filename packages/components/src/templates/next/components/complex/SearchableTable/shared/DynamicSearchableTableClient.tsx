"use client"

import { useMemo, useState } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  NativeSearchableTableProps,
} from "~/interfaces"
import { useDebounce } from "~/hooks/useDebounce"
import { useDgsData } from "~/hooks/useDgsData"
import { PAGINATION_MAX_ITEMS } from "./constants"
import { SearchableTableClientUI } from "./SearchableTableClientUI"

interface DynamicSearchableTableClientProps
  extends Omit<DGSSearchableTableProps, "items" | "headers"> {
  headers: NativeSearchableTableProps["headers"]
  maxNoOfColumns: number
  isMetadataLoading: boolean
  isMetadataError: boolean
}

export const DynamicSearchableTableClient = ({
  type,
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  site,
  LinkComponent,
  maxNoOfColumns, // not using MAX_NUMBER_OF_COLUMNS as we should not arbitrarily slice the columns
  isMetadataLoading,
  isMetadataError,
}: DynamicSearchableTableClientProps) => {
  const [_search, setSearch] = useState("")
  const search = useDebounce({ value: _search, delay: 300 })
  const [currPage, setCurrPage] = useState(1)

  const params = useMemo(
    () => ({
      resourceId,
      filters: filters?.reduce<
        NonNullable<DgsApiDatasetSearchParams["filters"]>
      >((acc, filter) => {
        acc[filter.fieldKey] = filter.fieldValue
        return acc
      }, {}),
      sort,
    }),
    [resourceId, filters, sort],
  )

  const {
    records,
    total,
    isLoading: isDataLoading,
    isError: isDataError,
  } = useDgsData({
    ...params,
    q: search,
    limit: PAGINATION_MAX_ITEMS,
    offset: (currPage - 1) * PAGINATION_MAX_ITEMS,
    fetchAll: false,
  })

  const filteredItems = records?.map((record) => Object.values(record)) ?? []

  const paginatedItems = filteredItems

  const isInitiallyEmpty =
    typeof total === "number" && (total === 0 || maxNoOfColumns === 0)

  const isFilteredEmpty =
    typeof total === "number" && total !== 0 && filteredItems.length === 0

  return (
    <SearchableTableClientUI
      type={type}
      title={title}
      headers={headers}
      site={site}
      LinkComponent={LinkComponent}
      isLoading={isMetadataLoading || isDataLoading}
      isError={isMetadataError || isDataError}
      search={{ input: _search, deferred: search, setSearch }}
      page={{ currPage, setCurrPage }}
      isInitiallyEmpty={isInitiallyEmpty}
      isFilteredEmpty={isFilteredEmpty}
      maxNoOfColumns={maxNoOfColumns}
      paginatedItems={paginatedItems}
      filteredItemsLength={total ?? 0}
    />
  )
}
