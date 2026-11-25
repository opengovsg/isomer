interface HandleUploadParams {
  file: File
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
  signal?: AbortSignal
}

// Use server-signed Content-Type and Content-Disposition so upload metadata
// cannot be overridden by the client (prevents stored XSS via type confusion).
export const handleAssetUpload = async ({
  file,
  presignedPutUrl,
  contentType,
  contentDisposition,
  signal,
}: HandleUploadParams) => {
  const response = await fetch(presignedPutUrl, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
    method: "PUT",
    body: file,
    signal,
  })

  if (!response.ok) {
    const data = (await response.json()) as unknown as { error: string }
    throw new Error(data.error)
  }
}
