import { useQuery } from "@tanstack/react-query"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

const getImageAsFile = async (imageUrl: string): Promise<File> => {
  const resp = await fetch(imageUrl)
  const blob = await resp.blob()
  const imageType = resp.headers.get("content-type")
  return new File([blob], imageUrl.split("/").pop() ?? "Unknown image", {
    type: imageType ?? "image/jpeg",
  })
}

export const useS3Image = (imagePath: string) => {
  const { data: image } = useQuery({
    queryKey: ["s3-image", imagePath],
    queryFn: () => getImageAsFile(`${ASSETS_BASE_URL}${imagePath}`),
    enabled: Boolean(imagePath),
  })

  return {
    image: imagePath ? image : undefined,
  }
}
