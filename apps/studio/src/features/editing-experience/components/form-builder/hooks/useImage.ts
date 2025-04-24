import { useState } from "react"

import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

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
  retries?: number
  baseTimeoutMs?: number
}
export const useImageUpload = ({
  retries = 3,
  baseTimeoutMs = 500,
}: UseImageProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const handleImageUpload = async (src: string) => {
    setIsLoading(true)
    try {
      const res = await retry(
        async () => {
          const response = await fetch(`${ASSETS_BASE_URL}${src}`)
          if (!response.ok) {
            throw new Error(`Unable to read from ${src}`)
          }
          return src
        },
        baseTimeoutMs,
        retries,
      )
      setIsLoading(false)
      return res
    } catch (e) {
      console.error(e)
      setIsLoading(false)
    }
  }

  return { handleImageUpload, isLoading }
}
