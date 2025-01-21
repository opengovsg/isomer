"use client"

import { useState } from "react"

const waitFor = (baseTimeoutMs = 500) => {
  return new Promise((resolve) => setTimeout(resolve, baseTimeoutMs))
}

const retry = async (
  promise: () => Promise<string>,
  baseTimeoutMs: number,
  maxRetries: number,
) => {
  const retryWithBackoff = async (retries: number) => {
    try {
      // Make sure we don't wait on the first attempt
      if (retries > 0) {
        const timeToWait = baseTimeoutMs * 2 ** retries
        await waitFor(timeToWait)
      }
      return await promise()
    } catch (e) {
      // NOTE: only retry if we didn't reach the limit
      // otherwise, let the caller handle the error
      if (retries < maxRetries) {
        return retryWithBackoff(retries + 1)
      } else {
        throw e
      }
    }
  }

  return retryWithBackoff(0)
}

interface UseImageProps {
  src: string
  fallback: string
  retries?: number
  baseTimeoutMs?: number
}
export const useImage = ({
  src,
  fallback,
  retries = 3,
  baseTimeoutMs = 500,
}: UseImageProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const onError: React.ReactEventHandler<HTMLImageElement> = ({
    currentTarget,
  }) => {
    retry(
      async () => {
        setIsLoading(true)
        const response = await fetch(src)
        if (!response.ok) {
          throw new Error(`Unable to read from ${src}`)
        }
        currentTarget.onerror = null
        currentTarget.src = src
        return src
      },
      baseTimeoutMs,
      retries,
    )
      .then(() => {
        setIsSuccess(true)
      })
      .catch(() => {
        currentTarget.onerror = null
        currentTarget.src = fallback
        setIsError(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return {
    isLoading,
    isSuccess,
    isError,
    onError,
  }
}
