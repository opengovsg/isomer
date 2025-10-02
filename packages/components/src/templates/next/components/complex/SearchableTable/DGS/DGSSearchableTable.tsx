"use client"

import { useMemo } from "react"

import type { DGSSearchableTableProps } from "~/interfaces"
import { useDgsMetadata } from "~/hooks/useDgsMetadata"
import { DGS_REQUEST_MAX_BYTES } from "~/utils/dgs"
import { DynamicDGSSearchableTable } from "./DynamicDGSSearchableTable"
import { StaticDGSSearchableTable } from "./StaticDGSSearchableTable"

export const DGSSearchableTable = ({
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

  const labels = useMemo(
    () => resolvedHeaders.map((header) => header.label ?? header.key),
    [resolvedHeaders],
  )

  if (metadata?.size && metadata.size < DGS_REQUEST_MAX_BYTES) {
    // Load all the data into memory, so we can display and filter on the client side
    return (
      <StaticDGSSearchableTable
        dataSource={dataSource}
        title={resolvedTitle}
        headers={resolvedHeaders}
        site={site}
        LinkComponent={LinkComponent}
        labels={labels}
        isMetadataLoading={isMetadataLoading}
        isMetadataError={isMetadataError}
      />
    )
  } else {
    // This is for datasets that are too large to load into memory,
    // so we need to fetch the data on the server side, using DGS API
    return (
      <DynamicDGSSearchableTable
        dataSource={dataSource}
        title={resolvedTitle}
        headers={labels}
        site={site}
        LinkComponent={LinkComponent}
        isMetadataLoading={isMetadataLoading}
        isMetadataError={isMetadataError}
        maxNoOfColumns={labels.length}
      />
    )
  }
}
