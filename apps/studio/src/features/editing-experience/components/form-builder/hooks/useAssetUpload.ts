import { useState } from "react"
import { backOff } from "exponential-backoff"

import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

interface UseAssetUploadProps {
  numOfAttempts?: number
  baseTimeoutMs?: number
}
export const useAssetUpload = ({
  numOfAttempts = 5,
  baseTimeoutMs = 500,
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
        {
          startingDelay: baseTimeoutMs,
          numOfAttempts,
          delayFirstAttempt: true,
        },
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
