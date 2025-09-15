"use client"

import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { DynamicSearchableTableClient } from "../shared"

interface DynamicDGSSearchableTableProps extends DGSSearchableTableProps {
  headers: NonNullable<DGSSearchableTableProps["headers"]>
  labels: SearchableTableClientProps["headers"]
  isMetadataLoading: boolean
  isMetadataError: boolean
}

export const DynamicDGSSearchableTable = ({
  type,
  dataSource,
  title,
  headers,
  site,
  LinkComponent,
  labels,
  isMetadataLoading,
  isMetadataError,
}: DynamicDGSSearchableTableProps) => {
  return (
    <DynamicSearchableTableClient
      type={type}
      dataSource={dataSource}
      title={title}
      headers={labels}
      site={site}
      LinkComponent={LinkComponent}
      isMetadataLoading={isMetadataLoading}
      isMetadataError={isMetadataError}
      maxNoOfColumns={labels.length}
    />
  )
}
