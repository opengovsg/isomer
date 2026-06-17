"use client"

import type { FetchDgsMetadataOutput } from "~/utils/dgs/fetchDgsMetadata"
import { useEffect, useState } from "react"
import { fetchDgsMetadata } from "~/utils/dgs/fetchDgsMetadata"

interface UseDgsMetadataProps {
  resourceId: string
  enabled?: boolean
}

interface FetchResult {
  resourceId: string
  metadata: FetchDgsMetadataOutput | undefined
  isError: boolean
}

export const useDgsMetadata = ({
  resourceId,
  enabled = true,
}: UseDgsMetadataProps) => {
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    if (!enabled) {
      setFetchResult(null)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const metadata = await fetchDgsMetadata({ resourceId })
        if (cancelled) return
        setFetchResult({
          resourceId,
          metadata,
          isError: false,
        })
      } catch {
        if (cancelled) return
        setFetchResult({
          resourceId,
          metadata: undefined,
          isError: true,
        })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [resourceId, enabled])

  if (!enabled) {
    return {
      metadata: undefined,
      isLoading: false,
      isError: false,
    }
  }

  const isStale = !fetchResult || fetchResult.resourceId !== resourceId

  return {
    metadata: isStale ? undefined : fetchResult.metadata,
    isLoading: isStale,
    isError: isStale ? false : fetchResult.isError,
  }
}
