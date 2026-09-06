"use client"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useMemo } from "react"
import { useDgsData } from "~/hooks/useDgsData"

import { SearchableTableClient } from "../shared/SearchableTableClient"

interface StaticDGSSearchableTableProps extends DGSSearchableTableProps {
  headers: NonNullable<DGSSearchableTableProps["headers"]>
  labels: SearchableTableClientProps["headers"]
  isMetadataLoading: boolean
  isMetadataError: boolean
}

export const StaticDGSSearchableTable = ({
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  labels,
  isMetadataLoading,
  isMetadataError,
}: StaticDGSSearchableTableProps) => {
  const params = useMemo(() => {
    let filterRecord:
      | NonNullable<DgsApiDatasetSearchParams["filters"]>
      | undefined

    if (filters) {
      filterRecord = {}
      for (const filter of filters) {
        filterRecord[filter.fieldKey] = filter.fieldValue
      }
    }

    return {
      filters: filterRecord,
      resourceId,
      sort,
    }
  }, [resourceId, filters, sort])

  const {
    records,
    isLoading: isDataLoading,
    isError: isDataError,
  } = useDgsData({
    ...params,
    fetchAll: true,
  })

  const keys = headers.map((header) => header.key)
  const items: SearchableTableClientProps["items"] =
    records?.map((record) => {
      const content = keys.map((field) => String(record[field] ?? ""))
      return {
        key: content.join(" ").toLowerCase(),
        row: content,
      }
    }) ?? []

  return (
    <SearchableTableClient
      title={title}
      headers={labels}
      items={items}
      isLoading={isMetadataLoading || isDataLoading}
      isError={isMetadataError || isDataError}
    />
  )
}
