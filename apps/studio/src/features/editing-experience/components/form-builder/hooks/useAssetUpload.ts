import { useState } from "react"
import { backOff } from "exponential-backoff"

import { env } from "~/env.mjs"

interface UseAssetUploadProps {
  retries?: number
  baseTimeoutMs?: number
}
export const useAssetUpload = ({
  retries = 3,
  baseTimeoutMs = 500,
}: UseAssetUploadProps) => {
  const assetsBaseUrl = `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
  const [isLoading, setIsLoading] = useState(false)
  const handleAssetUpload = async (src: string) => {
    setIsLoading(true)
    try {
      const res = await backOff(
        async () => {
          const response = await fetch(`${assetsBaseUrl}${src}`)
          if (!response.ok) {
            throw new Error(`Unable to read from ${src}`)
          }
          return src
        },
        {
          startingDelay: baseTimeoutMs,
          numOfAttempts: retries,
          delayFirstAttempt: true,
        },
      )
      setIsLoading(false)
      return res
    } catch (e) {
      console.error(e)
      setIsLoading(false)
    }
  }

  return { handleAssetUpload, isLoading }
}
