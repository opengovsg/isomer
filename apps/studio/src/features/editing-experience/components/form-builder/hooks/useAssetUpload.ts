import { useState } from "react"
import { backOff } from "exponential-backoff"

import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

interface UseAssetUploadProps {
  numOfAttempts?: number
  baseTimeoutMs?: number
}

const DEFAULT_NUM_OF_ATTEMPTS = 10
const DEFAULT_BASE_TIMEOUT_MS = 1000
// Cap exponential delay to avoid multi-minute hangs on failed uploads.
export const MAX_ASSET_UPLOAD_BACKOFF_DELAY_MS = 8000

export const getAssetUploadBackoffOptions = ({
  numOfAttempts = DEFAULT_NUM_OF_ATTEMPTS,
  baseTimeoutMs = DEFAULT_BASE_TIMEOUT_MS,
}: UseAssetUploadProps) => ({
  startingDelay: baseTimeoutMs,
  numOfAttempts,
  delayFirstAttempt: true,
  maxDelay: MAX_ASSET_UPLOAD_BACKOFF_DELAY_MS,
})

export const useAssetUpload = ({
  numOfAttempts = DEFAULT_NUM_OF_ATTEMPTS,
  baseTimeoutMs = DEFAULT_BASE_TIMEOUT_MS,
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
        getAssetUploadBackoffOptions({ numOfAttempts, baseTimeoutMs }),
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
