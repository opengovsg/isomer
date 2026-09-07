import { z } from "zod"

interface HandleUploadParams {
  file: File
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}

const uploadErrorResponseSchema = z.object({
  error: z.string(),
})

// Use server-signed Content-Type and Content-Disposition so upload metadata
// cannot be overridden by the client (prevents stored XSS via type confusion).
export const handleAssetUpload = async ({
  file,
  presignedPutUrl,
  contentType,
  contentDisposition,
}: HandleUploadParams) => {
  const response = await fetch(presignedPutUrl, {
    body: file,
    headers: {
      "Content-Disposition": contentDisposition,
      "Content-Type": contentType,
    },
    method: "PUT",
  })

  if (!response.ok) {
    const data = uploadErrorResponseSchema.parse(await response.json())
    throw new Error(data.error)
  }
}
