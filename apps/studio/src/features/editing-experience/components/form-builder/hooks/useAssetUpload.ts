import { useState } from "react"
import { backOff } from "exponential-backoff"

import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

interface UseAssetUploadProps {
  numOfAttempts?: number
  baseTimeoutMs?: number
}

export const ASSET_UPLOAD_MAX_BACKOFF_MS = 5000

export const getAssetUploadBackoffOptions = ({
  baseTimeoutMs,
  numOfAttempts,
}: Required<UseAssetUploadProps>) => ({
  startingDelay: baseTimeoutMs,
  numOfAttempts,
  delayFirstAttempt: true,
  maxDelay: ASSET_UPLOAD_MAX_BACKOFF_MS,
})

export const useAssetUpload = ({
  numOfAttempts = 10,
  baseTimeoutMs = 1000,
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
          baseTimeoutMs,
          numOfAttempts,
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
