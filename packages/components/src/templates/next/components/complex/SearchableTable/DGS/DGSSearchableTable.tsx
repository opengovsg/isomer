"use client"

import { useMemo } from "react"

import type { DGSSearchableTableProps } from "~/interfaces"
import { useDgsMetadata } from "~/hooks/useDgsMetadata"
import { DGS_REQUEST_MAX_BYTES } from "~/utils/dgs"
import { StaticDGSSearchableTable } from "./StaticDGSSearchableTable"

export const DGSSearchableTable = ({
  type,
  dataSource,
  title,
  headers,
  site,
  LinkComponent,
}: DGSSearchableTableProps) => {
  const {
    metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
  } = useDgsMetadata({ resourceId: dataSource.resourceId })

  const resolvedTitle = useMemo(() => {
    const hasUserProvidedTitle = !!title
    if (hasUserProvidedTitle) {
      return title
    }
    return metadata?.name
  }, [title, metadata?.name])

  const resolvedHeaders = useMemo(() => {
    const hasUserProvidedHeaders = headers && headers.length > 0
    if (hasUserProvidedHeaders) {
      return headers
    }
    if (metadata?.columnMetadata) {
      return metadata.columnMetadata.map(([key, label]) => ({ key, label }))
    }
    return []
  }, [headers, metadata?.columnMetadata])

  const isDatasetUnderMaxSize =
    metadata?.size && metadata.size < DGS_REQUEST_MAX_BYTES

  if (isDatasetUnderMaxSize) {
    // Load all the data into memory, so we can display and filter on the client side
    return (
      <StaticDGSSearchableTable
        type={type}
        dataSource={dataSource}
        title={resolvedTitle}
        headers={resolvedHeaders}
        site={site}
        LinkComponent={LinkComponent}
        isMetadataLoading={isMetadataLoading}
        isMetadataError={isMetadataError}
      />
    )
  } else {
    // TODO: Implement DynamicDGSSearchableTable
    // This is for datasets that are too large to load into memory,
    // so we need to fetch the data on the server side, using DGS API
    return null
  }
}
