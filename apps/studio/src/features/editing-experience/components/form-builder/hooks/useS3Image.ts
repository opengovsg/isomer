import { useEffect, useState } from "react"

import { generateAssetBaseUrl } from "~/utils/generateAssetUrl"

const getImageAsFile = async (imageUrl: string): Promise<File> => {
  const resp = await fetch(imageUrl)
  const blob = await resp.blob()
  const imageType = resp.headers.get("content-type")
  return new File([blob], imageUrl.split("/").pop() ?? "Unknown image", {
    type: imageType ?? "image/jpeg",
  })
}

export const useS3Image = (imagePath: string) => {
  const [image, setImage] = useState<File | undefined>()

  useEffect(() => {
    if (!imagePath) {
      setImage(undefined)
      return
    }
    getImageAsFile(`${generateAssetBaseUrl()}${imagePath}`)
      .then((image) => {
        setImage(image)
      })
      .catch(console.error)
  }, [imagePath])

  return {
    image,
  }
}
