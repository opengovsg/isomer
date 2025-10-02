"use client"

import { useMemo, useState } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useDebounce } from "~/hooks/useDebounce"
import { useDgsData } from "~/hooks/useDgsData"
import { PAGINATION_MAX_ITEMS } from "../shared/constants"
import { SearchableTableClientUI } from "../shared/SearchableTableClientUI"

interface DynamicSearchableTableClientProps
  extends Omit<DGSSearchableTableProps, "items" | "headers"> {
  headers: SearchableTableClientProps["headers"]
  isMetadataLoading: boolean
  isMetadataError: boolean
  maxNoOfColumns: number
}

export const DynamicDGSSearchableTable = ({
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  site,
  LinkComponent,
  isMetadataLoading,
  isMetadataError,
  maxNoOfColumns, // not using MAX_NUMBER_OF_COLUMNS as we should not arbitrarily slice the columns
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

  const { total } = useDgsData({ ...params, fetchAll: false })

  const {
    records,
    total: numberOfRecords,
    isLoading: isDataLoading,
    isError: isDataError,
  } = useDgsData({
    ...params,
    q: search,
    limit: PAGINATION_MAX_ITEMS,
    offset: (currPage - 1) * PAGINATION_MAX_ITEMS,
    fetchAll: false,
  })

  const items = records?.map((record) => Object.values(record)) ?? []

  const isInitiallyEmpty =
    typeof total === "number" && (total === 0 || maxNoOfColumns === 0)

  const isFilteredEmpty =
    typeof total === "number" && total !== 0 && items.length === 0

  return (
    <SearchableTableClientUI
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
      paginatedItems={items}
      filteredItemsLength={numberOfRecords ?? 0}
      searchMatchType="fullTextMatch"
    />
  )
}
