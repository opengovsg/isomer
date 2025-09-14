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
  isMetadataLoading: boolean
  isMetadataError: boolean
}

export const StaticDGSSearchableTable = ({
  type,
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  site,
  LinkComponent,
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

  const labels = useMemo(
    () => headers.map((header) => header.label ?? header.key),
    [headers],
  )

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
      type={type}
      title={title}
      headers={labels}
      items={items}
      site={site}
      LinkComponent={LinkComponent}
      isLoading={isMetadataLoading || isDataLoading}
      isError={isMetadataError || isDataError}
    />
  )
}
