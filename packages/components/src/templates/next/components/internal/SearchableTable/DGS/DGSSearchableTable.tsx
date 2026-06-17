"use client"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useMemo } from "react"
import { useAllDgsRecords } from "~/hooks/useDgsData"
import { useDgsMetadata } from "~/hooks/useDgsMetadata"
import { DGS_MAX_DATASET_BYTES } from "~/utils/dgs"

import { SearchableTableClient } from "../shared"

export const DGSSearchableTable = ({
  dataSource: { resourceId, filters, sort },
  title,
  headers,
}: DGSSearchableTableProps) => {
  const {
    metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
  } = useDgsMetadata({ resourceId })

  const isOverCap =
    metadata?.size !== undefined && metadata.size > DGS_MAX_DATASET_BYTES

  const resolvedTitle = useMemo(() => {
    if (title) return title
    return metadata?.name
  }, [title, metadata?.name])

  const resolvedHeaders = useMemo(() => {
    if (headers && headers.length > 0) return headers
    if (metadata?.columnMetadata) {
      return metadata.columnMetadata.map(([key, label]) => ({ key, label }))
    }
    return []
  }, [headers, metadata?.columnMetadata])

  const labels = useMemo(
    () => resolvedHeaders.map((header) => header.label ?? header.key),
    [resolvedHeaders],
  )

  const memoizedFilters = useMemo(
    () =>
      filters?.reduce<NonNullable<DgsApiDatasetSearchParams["filters"]>>(
        (acc, filter) => {
          acc[filter.fieldKey] = filter.fieldValue
          return acc
        },
        {},
      ),
    [filters],
  )

  const {
    records,
    isLoading: isDataLoading,
    isError: isDataError,
  } = useAllDgsRecords({
    resourceId,
    datasetSize: metadata?.size ?? 0,
    filters: memoizedFilters,
    sort,
    enabled: !!metadata?.size && !isOverCap,
  })

  const items: SearchableTableClientProps["items"] = useMemo(() => {
    const keys = resolvedHeaders.map((header) => header.key)
    return records.map((record) => {
      const content = keys.map((field) => String(record[field] ?? ""))
      return {
        key: content.join(" ").toLowerCase(),
        row: content,
      }
    })
  }, [records, resolvedHeaders])

  return (
    <SearchableTableClient
      title={resolvedTitle}
      headers={labels}
      items={items}
      isLoading={isMetadataLoading || isDataLoading}
      isError={isMetadataError || isDataError || isOverCap}
    />
  )
}
