"use client"

import type { FetchDgsMetadataOutput } from "~/utils/dgs/fetchDgsMetadata"
import { useEffect, useState } from "react"
import { fetchDgsMetadata } from "~/utils/dgs/fetchDgsMetadata"

interface UseDgsMetadataProps {
  resourceId: string
  enabled?: boolean
}

export const useDgsMetadata = ({
  resourceId,
  enabled = true,
}: UseDgsMetadataProps) => {
  const [isLoading, setIsLoading] = useState(enabled)
  const [isError, setIsError] = useState(false)
  const [metadata, setMetadata] = useState<FetchDgsMetadataOutput | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    // This is to ensure this hook does not run during server-side rendering
    // as DGS has rate limits for unauthenticated requests for non-whitelisted domains
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    const fetchMetadata = async () => {
      setIsLoading(true)
      try {
        const metadata = await fetchDgsMetadata({ resourceId })
        setMetadata(metadata)
        setIsError(false)
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchMetadata()
  }, [resourceId, enabled])

  return {
    metadata,
    isLoading,
    isError,
  }
}
