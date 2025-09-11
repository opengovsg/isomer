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
  // If user provided headers, we use them,
  // otherwise we fetch the column metadata from DGS to display the column titles
  const hasUserProvidedHeaders = headers && headers.length > 0

  const {
    metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
  } = useDgsMetadata({ resourceId, enabled: !hasUserProvidedHeaders })

  const computedHeaders: NonNullable<DGSSearchableTableProps["headers"]> =
    useMemo(() => {
      if (hasUserProvidedHeaders) {
        return headers
      }

      if (metadata?.columnMetadata) {
        return metadata.columnMetadata.map(([key, label]) => ({ key, label }))
      }

      return []
    }, [headers, hasUserProvidedHeaders, metadata?.columnMetadata])

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

  const labels = useMemo(
    () => computedHeaders.map((header) => header.label ?? header.key),
    [computedHeaders],
  )

  const items: SearchableTableClientProps["items"] = useMemo(() => {
    const keys = computedHeaders.map((header) => header.key)
    return (
      records?.map((record) => {
        const content = keys.map((field) => String(record[field] ?? ""))
        return {
          key: content.join(" ").toLowerCase(),
          row: content,
        }
      }) ?? []
    )
  }, [records, computedHeaders])

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
          : isMetadataLoading || isDataLoading
      }
      isError={
        hasUserProvidedHeaders ? isDataError : isMetadataError || isDataError
      }
    />
  )
}
