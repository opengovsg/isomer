import type { UploadConfig } from "~/server/modules/asset/asset.service"
import { handleAssetUpload } from "~/hooks/handleAssetUpload"

export const performUpload = async (
  file: File,
  fileKey: string,
  config: UploadConfig,
  signal?: AbortSignal,
): Promise<string> => {
  await handleAssetUpload({
    file,
    presignedPutUrl: config.presignedPutUrl,
    contentType: config.contentType,
    contentDisposition: config.contentDisposition,
    signal,
  })
  return `/${fileKey}`
}
