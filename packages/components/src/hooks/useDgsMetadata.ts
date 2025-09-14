"use client"

import { useEffect, useState } from "react"

import type { FetchDgsMetadataOutput } from "~/utils/dgs/fetchDgsMetadata"
import { fetchDgsMetadata } from "~/utils/dgs/fetchDgsMetadata"

interface UseDgsMetadataProps {
  resourceId: string
}

export const useDgsMetadata = ({ resourceId }: UseDgsMetadataProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [metadata, setMetadata] = useState<FetchDgsMetadataOutput | undefined>(
    undefined,
  )

  useEffect(() => {
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
  }, [resourceId])

  return {
    metadata,
    isLoading,
    isError,
  }
}
