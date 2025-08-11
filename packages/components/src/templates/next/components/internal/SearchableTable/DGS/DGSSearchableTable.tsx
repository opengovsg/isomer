"use client"

import { useMemo } from "react"

import type { SearchableTableClientProps } from "../shared"
import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type { DGSSearchableTableProps } from "~/interfaces"
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
      filters: filters?.reduce(
        (acc, filter) => {
          acc[filter.fieldKey] = filter.fieldValue
          return acc
        },
        {} as NonNullable<DgsApiDatasetSearchParams["filters"]>,
      ),
      sort,
    }),
    [resourceId, filters, sort, fieldKeys],
  )

  const { records, isLoading, isError } = useDgsData(params)

  const items: SearchableTableClientProps["items"] = useMemo(
    () =>
      records?.map((record) => {
        const content = fieldKeys.map((field) => String(record[field] ?? ""))
        return {
          key: content.join(" "),
          row: content,
        }
      }) ?? [],
    [records, fieldKeys],
  )

  // TODO: better handling of these non-success states
  // will check with SY for design
  if (isLoading) {
    return <div>Loading...</div>
  }

  // Should display nothing if there is an realtime error
  // as any rendering will likely seems jank and useless
  if (isError || records?.length === 0 || items.length === 0) {
    return null
  }

  return (
    <SearchableTableClient
      title={title}
      headers={labels}
      items={items}
      site={site}
      LinkComponent={LinkComponent}
    />
  )
}
