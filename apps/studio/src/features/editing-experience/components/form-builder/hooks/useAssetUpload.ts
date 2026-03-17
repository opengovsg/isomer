import { useState } from "react"
import { backOff } from "exponential-backoff"

import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

interface UseAssetUploadProps {
  numOfAttempts?: number
  baseTimeoutMs?: number
  maxDelayMs?: number
}

const DEFAULT_NUM_OF_ATTEMPTS = 10
const DEFAULT_BASE_TIMEOUT_MS = 1000
const DEFAULT_MAX_DELAY_MS = 5000

export const getAssetUploadBackoffOptions = ({
  numOfAttempts,
  baseTimeoutMs,
  maxDelayMs,
}: Required<UseAssetUploadProps>) => ({
  startingDelay: baseTimeoutMs,
  numOfAttempts,
  delayFirstAttempt: true,
  // Guard against unbounded exponential retries that can freeze upload UX.
  maxDelay: maxDelayMs,
})

export const useAssetUpload = ({
  numOfAttempts = DEFAULT_NUM_OF_ATTEMPTS,
  baseTimeoutMs = DEFAULT_BASE_TIMEOUT_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
}: UseAssetUploadProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const handleAssetUpload = async (src: string) => {
    setIsLoading(true)
    try {
      await backOff(
        async () => {
          const response = await fetch(`${ASSETS_BASE_URL}${src}`)
          if (!response.ok) {
            throw new Error(`Unable to read from ${src}`)
          }
          return src
        },
        getAssetUploadBackoffOptions({
          numOfAttempts,
          baseTimeoutMs,
          maxDelayMs,
        }),
      )
      return src
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return { handleAssetUpload, isLoading }
}
