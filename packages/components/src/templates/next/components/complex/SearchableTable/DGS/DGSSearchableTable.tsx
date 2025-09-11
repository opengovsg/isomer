"use client"

import { useMemo } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useDgsData } from "~/hooks/useDgsData"
import { useDgsMetadata } from "~/hooks/useDgsMetadata"
import { SearchableTableClient } from "../shared"

export const DGSSearchableTable = ({
  type,
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  site,
  LinkComponent,
}: DGSSearchableTableProps) => {
  const hasUserProvidedHeaders = headers && headers.length > 0

  const fieldKeys = useMemo(
    () => (hasUserProvidedHeaders ? headers.map((header) => header.key) : []),
    [headers, hasUserProvidedHeaders],
  )

  const params = useMemo(
    () => ({
      resourceId,
      fields: hasUserProvidedHeaders ? fieldKeys.join(",") : undefined,
      filters: filters?.reduce<
        NonNullable<DgsApiDatasetSearchParams["filters"]>
      >((acc, filter) => {
        acc[filter.fieldKey] = filter.fieldValue
        return acc
      }, {}),
      sort,
    }),
    [resourceId, filters, sort, fieldKeys, hasUserProvidedHeaders],
  )

  const {
    metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
  } = useDgsMetadata({ resourceId, enabled: !hasUserProvidedHeaders })

  // TODO: Consider implementing pagination or virtualization instead of fetchAll for large datasets.
  // Currently, we fetch all records at once, which may not scale well.
  const {
    records,
    isLoading: isDataLoading,
    isError: isDataError,
  } = useDgsData({
    ...params,
    fetchAll: true,
  })

  const labels = useMemo(() => {
    // If user has provided headers, use them
    if (hasUserProvidedHeaders) {
      return headers.map((header) => header.label ?? header.key)
    }

    // If user has not provided headers, use the column metadata
    const columnMetadata = metadata?.columnMetadata
    if (columnMetadata && columnMetadata.length > 0) {
      return columnMetadata.map(([_, label]) => label)
    }

    return []
  }, [headers, hasUserProvidedHeaders, metadata?.columnMetadata])

  const items: SearchableTableClientProps["items"] = useMemo(() => {
    const keys = hasUserProvidedHeaders
      ? fieldKeys
      : (metadata?.columnMetadata?.map(([key]) => key) ?? [])

    return (
      records?.map((record) => {
        const content = keys.map((field) => String(record[field] ?? ""))
        return {
          key: content.join(" ").toLowerCase(),
          row: content,
        }
      }) ?? []
    )
  }, [records, fieldKeys, hasUserProvidedHeaders, metadata?.columnMetadata])

  return (
    <SearchableTableClient
      type={type}
      title={title}
      headers={labels}
      items={items}
      site={site}
      LinkComponent={LinkComponent}
      isLoading={
        hasUserProvidedHeaders
          ? isDataLoading
          : isMetadataLoading && isDataLoading
      }
      isError={
        hasUserProvidedHeaders ? isDataError : isMetadataError && isDataError
      }
    />
  )
}
