"use client"

import { useMemo } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  SearchableTableClientProps,
} from "~/interfaces"
import { useDgsData } from "~/hooks/useDgsData"
import { SearchableTableClient } from "../shared"

export const DGSSearchableTable = ({
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  site,
  LinkComponent,
}: DGSSearchableTableProps) => {
  const labels = useMemo(() => headers.map((header) => header.label), [headers])

  const fieldKeys = useMemo(
    () => headers.map((header) => header.key),
    [headers],
  )

  const params = useMemo(
    () => ({
      resourceId,
      fields: fieldKeys.join(","),
      filters: filters?.reduce<
        NonNullable<DgsApiDatasetSearchParams["filters"]>
      >((acc, filter) => {
        acc[filter.fieldKey] = filter.fieldValue
        return acc
      }, {}),
      sort,
    }),
    [resourceId, filters, sort, fieldKeys],
  )
  // TODO: Consider implementing pagination or virtualization instead of fetchAll for large datasets.
  // Currently, we fetch all records at once, which may not scale well.
  const { records, isLoading, isError } = useDgsData({
    ...params,
    fetchAll: true,
  })

  const items: SearchableTableClientProps["items"] = useMemo(
    () =>
      records?.map((record) => {
        const content = fieldKeys.map((field) => String(record[field] ?? ""))
        return {
          key: content.join(" ").toLowerCase(),
          row: content,
        }
      }) ?? [],
    [records, fieldKeys],
  )

  return (
    <SearchableTableClient
      title={title}
      headers={labels}
      items={items}
      site={site}
      LinkComponent={LinkComponent}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
