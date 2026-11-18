interface HandleUploadParams {
  file: File
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
  tagging?: string
}

// Use server-signed Content-Type and Content-Disposition so upload metadata
// cannot be overridden by the client (prevents stored XSS via type confusion).
export const handleAssetUpload = async ({
  file,
  presignedPutUrl,
  contentType,
  contentDisposition,
  tagging,
}: HandleUploadParams) => {
  const response = await fetch(presignedPutUrl, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      // S3 only applies tags sent as this header, never from the query string
      ...(tagging !== undefined && { "x-amz-tagging": tagging }),
    },
    method: "PUT",
    body: file,
  })

  if (!response.ok) {
    const data = (await response.json()) as unknown as { error: string }
    throw new Error(data.error)
  }
}
