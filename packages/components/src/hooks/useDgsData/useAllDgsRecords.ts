"use client"

import { useEffect, useState } from "react"

import type { DgsApiDatasetSearchResponseSuccess } from "./types"
import { fetchAllRecordsInChunks } from "./fetchAllRecordsInChunks"

type DgsRecord = DgsApiDatasetSearchResponseSuccess["result"]["records"][number]

interface UseAllDgsRecordsParams {
  resourceId: string
  datasetSize: number
  filters?: Record<string, string>
  sort?: string
  enabled?: boolean
}

export const useAllDgsRecords = ({
  resourceId,
  datasetSize,
  filters,
  sort,
  enabled = true,
}: UseAllDgsRecordsParams) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [records, setRecords] = useState<DgsRecord[]>([])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const result = await fetchAllRecordsInChunks({
          resourceId,
          datasetSize,
          filters,
          sort,
        })
        if (cancelled) return
        setRecords(result.records)
      } catch {
        if (cancelled) return
        setIsError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, resourceId, datasetSize, filters, sort])

  return { records, isLoading, isError }
}
