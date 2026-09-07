import type { UploadConfig } from "~/server/modules/asset/asset.service"
import { handleAssetUpload } from "~/hooks/handleAssetUpload"

export const performUpload = async (
  file: File,
  fileKey: string,
  config: UploadConfig,
): Promise<string> => {
  await handleAssetUpload({
    contentDisposition: config.contentDisposition,
    contentType: config.contentType,
    file,
    presignedPutUrl: config.presignedPutUrl,
  })
  return `/${fileKey}`
}
