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
  // If user provided headers/title, we use them,
  // otherwise we fetch the metadata from DGS to display as default
  const hasUserProvidedTitle = !!title
  const hasUserProvidedHeaders = headers && headers.length > 0
  const shouldFetchMetadata = !hasUserProvidedTitle || !hasUserProvidedHeaders

  const {
    metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
  } = useDgsMetadata({ resourceId, enabled: shouldFetchMetadata })

  const resolvedTitle = useMemo(() => {
    if (hasUserProvidedTitle) {
      return title
    }
    return metadata?.name
  }, [title, metadata?.name, hasUserProvidedTitle])

  const resolvedHeaders = useMemo(() => {
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
    () => resolvedHeaders.map((header) => header.label ?? header.key),
    [resolvedHeaders],
  )

  const items: SearchableTableClientProps["items"] = useMemo(() => {
    const keys = resolvedHeaders.map((header) => header.key)
    return (
      records?.map((record) => {
        const content = keys.map((field) => String(record[field] ?? ""))
        return {
          key: content.join(" ").toLowerCase(),
          row: content,
        }
      }) ?? []
    )
  }, [records, resolvedHeaders])

  return (
    <SearchableTableClient
      type={type}
      title={resolvedTitle}
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
