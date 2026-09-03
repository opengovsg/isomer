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
  const [validatedResourceId, setValidatedResourceId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    const controller = new AbortController()

    const fetchMetadata = async () => {
      setIsLoading(true)
      setMetadata(undefined)
      setValidatedResourceId(null)
      try {
        const metadata = await fetchDgsMetadata({
          resourceId,
          signal: controller.signal,
        })
        setMetadata(metadata)
        setValidatedResourceId(resourceId)
        setIsError(false)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        setIsError(true)
        setValidatedResourceId(null)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void fetchMetadata()

    return () => {
      controller.abort()
    }
  }, [resourceId, enabled])

  const isMetadataCurrent = validatedResourceId === resourceId

  return {
    metadata,
    isLoading,
    isError,
    isMetadataCurrent,
  }
}
