"use client"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
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
  const params = {
    resourceId,
    filters: filters?.reduce<
      NonNullable<DgsApiDatasetSearchParams["filters"]>
    >((acc, filter) => {
      acc[filter.fieldKey] = filter.fieldValue
      return acc
    }, {}),
    sort,
  }

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
