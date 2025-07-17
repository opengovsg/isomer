"use client"

import { useEffect, useMemo, useState } from "react"

import type { SearchableTableClientProps } from "../Native/SearchableTableClient"
import type { DGSResponse, DGSSearchableTableProps } from "~/interfaces"
import { SearchableTableClient } from "../Native/SearchableTableClient"
import { fetchDataFromDGS } from "./fetchDataFromDGS"

export const DGSSearchableTable = ({
  title,
  dgsResourceId,
  headers,
  site,
  LinkComponent,
}: DGSSearchableTableProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DGSResponse | null>(null)

  const labels = useMemo(() => headers.map((header) => header.label), [headers])

  const fieldKeys = useMemo(
    () => headers.map((header) => header.key),
    [headers],
  )

  useEffect(() => {
    async function fetchAllData() {
      try {
        // First fetch (default limit from DGS API)
        const initialData = await fetchDataFromDGS({
          resourceId: dgsResourceId,
          fields: fieldKeys,
        })

        const numberOfRecords = initialData.result.total

        // If there are no records, set empty data and return early
        if (!numberOfRecords || numberOfRecords === 0) {
          throw new Error("No records found")
        }

        const response = await fetchDataFromDGS({
          resourceId: dgsResourceId,
          fields: fieldKeys,
          limit: numberOfRecords,
        })

        setData(response)
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchAllData()
  }, [])

  const items: SearchableTableClientProps["items"] = useMemo(
    () =>
      data?.result.records.map((record) => {
        const content = fieldKeys.map((field) => String(record[field] ?? ""))

        return {
          key: content.join(" "),
          row: content,
        }
      }) ?? [],
    [data, fieldKeys],
  )

  // TODO: better handling of these non-success states
  if (isLoading || isError || items.length === 0) {
    return <div>Loading...</div>
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
