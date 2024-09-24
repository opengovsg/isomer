import type { UseQueryResult } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"

const getImageFileFromUrl = async (url?: string, assetsDomain?: string) => {
  if (!url) return undefined

  const fileName = url.split("/").pop() || "image"
  const fileType = `image/${url.split(".").pop()}`
  const imageUrl =
    url.startsWith("/") && assetsDomain ? `https://${assetsDomain}${url}` : url

  const response = await fetch(imageUrl)

  if (response.status >= 400) throw new Error()

  const blob = await response.blob()
  return new File([blob], fileName, { type: fileType })
}

export const useGetImageFileFromUrl = (
  url?: string,
  assetsDomain?: string,
): UseQueryResult<File | undefined> => {
  return useQuery<File | undefined>(
    ["getImageFileFromUrl", url],
    () => getImageFileFromUrl(url, assetsDomain),
    {
      retry: false,
    },
  )
}
