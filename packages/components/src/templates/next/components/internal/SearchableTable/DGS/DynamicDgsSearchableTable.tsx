"use client"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useMemo, useState } from "react"
import { useDebounce } from "~/hooks/useDebounce"
import { useDgsData } from "~/hooks/useDgsData"
import { isCkanInternalColumn } from "~/utils/dgs"

import { PAGINATION_MAX_ITEMS } from "../shared/constants"
import { SearchableTableClientUI } from "../shared/SearchableTableClientUi"

interface DynamicSearchableTableClientProps extends Omit<
  DGSSearchableTableProps,
  "items" | "headers"
> {
  headers: SearchableTableClientProps["headers"]
  isMetadataLoading: boolean
  isMetadataError: boolean
  maxNoOfColumns: number
}

export const DynamicDGSSearchableTable = ({
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  isMetadataLoading,
  isMetadataError,
  maxNoOfColumns, // not using MAX_NUMBER_OF_COLUMNS as we should not arbitrarily slice the columns
}: DynamicSearchableTableClientProps) => {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce({ delay: 300, value: searchInput })
  const [currPage, setCurrPage] = useState(1)

  const params = useMemo(
    () => ({
      filters: filters?.reduce<
        NonNullable<DgsApiDatasetSearchParams["filters"]>
      >((acc, filter) => {
        acc[filter.fieldKey] = filter.fieldValue
        return acc
      }, {}),
      resourceId,
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
    fetchAll: false,
    limit: PAGINATION_MAX_ITEMS,
    offset: (currPage - 1) * PAGINATION_MAX_ITEMS,
    q: search,
  })

  const items =
    records?.map((record) => {
      const row: (string | number)[] = []

      for (const [key, value] of Object.entries(record)) {
        if (!isCkanInternalColumn(key)) {
          row.push(value)
        }
      }

      return row
    }) ?? []

  const totalCount = Number(total)
  const isInitiallyEmpty =
    Number.isFinite(totalCount) && (totalCount === 0 || maxNoOfColumns === 0)

  const isFilteredEmpty =
    Number.isFinite(totalCount) && totalCount !== 0 && items.length === 0

  return (
    <SearchableTableClientUI
      title={title}
      headers={headers}
      isLoading={isMetadataLoading || isDataLoading}
      isError={isMetadataError || isDataError}
      search={{
        deferred: search,
        input: searchInput,
        setSearch: setSearchInput,
      }}
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
