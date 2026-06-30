import { upload as vercelUpload } from "@vercel/blob/client"
import { handleAssetUpload } from "~/hooks/handleAssetUpload"

import type { UploadConfig } from "."

export const performUpload = async (
  file: File,
  fileKey: string,
  config: UploadConfig,
): Promise<string> => {
  if (config.provider === "s3") {
    await handleAssetUpload({
      file,
      presignedPutUrl: config.presignedPutUrl,
      contentType: config.contentType,
      contentDisposition: config.contentDisposition,
    })
    return `/${fileKey}`
  }

  const blob = await vercelUpload(fileKey, file, {
    access: "public",
    handleUploadUrl: config.handleUploadUrl,
    contentType: config.contentType,
    clientPayload: config.clientPayload,
  })
  return blob.url
}
