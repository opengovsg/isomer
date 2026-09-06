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
  const [metadata, setMetadata] = useState<FetchDgsMetadataOutput | undefined>()

  useEffect(() => {
    const controller = new AbortController()

    if (!enabled) {
      return () => {
        controller.abort()
      }
    }

    const fetchMetadata = async (): Promise<void> => {
      setIsLoading(true)
      setMetadata(undefined)
      try {
        const fetchedMetadata = await fetchDgsMetadata({
          resourceId,
          signal: controller.signal,
        })
        setMetadata(fetchedMetadata)
        setIsError(false)
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        setIsError(true)
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchMetadata()

    return () => {
      controller.abort()
    }
  }, [resourceId, enabled])

  return {
    isError,
    isLoading,
    metadata,
  }
}
