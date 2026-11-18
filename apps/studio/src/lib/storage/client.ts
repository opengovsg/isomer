import type { UploadConfig } from "~/server/modules/asset/asset.service"
import { handleAssetUpload } from "~/hooks/handleAssetUpload"

export const performUpload = async (
  file: File,
  fileKey: string,
  config: UploadConfig,
): Promise<string> => {
  await handleAssetUpload({
    file,
    presignedPutUrl: config.presignedPutUrl,
    contentType: config.contentType,
    contentDisposition: config.contentDisposition,
  })
  return `/${fileKey}`
}
