"use client"

import { useMemo } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useDgsData } from "~/hooks/useDgsData"
import { SearchableTableClient } from "../shared"

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
  LinkComponent,
  labels,
  isMetadataLoading,
  isMetadataError,
}: StaticDGSSearchableTableProps) => {
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
    isLoading: isDataLoading,
    isError: isDataError,
  } = useDgsData({
    ...params,
    fetchAll: true,
  })

  const items: SearchableTableClientProps["items"] = useMemo(() => {
    const keys = headers.map((header) => header.key)
    return (
      records?.map((record) => {
        const content = keys.map((field) => String(record[field] ?? ""))
        return {
          key: content.join(" ").toLowerCase(),
          row: content,
        }
      }) ?? []
    )
  }, [records, headers])

  return (
    <SearchableTableClient
      title={title}
      headers={labels}
      items={items}
      LinkComponent={LinkComponent}
      isLoading={isMetadataLoading || isDataLoading}
      isError={isMetadataError || isDataError}
    />
  )
}
