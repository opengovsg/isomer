interface HandleUploadParams {
  file: File
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}

// Use server-signed Content-Type and Content-Disposition so upload metadata
// cannot be overridden by the client (prevents stored XSS via type confusion).
export const handleAssetUpload = async ({
  file,
  presignedPutUrl,
  contentType,
  contentDisposition,
}: HandleUploadParams) => {
  const response = await fetch(presignedPutUrl, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
    method: "PUT",
    body: file,
  })

  if (!response.ok) {
    let detail: string
    try {
      const contentType = response.headers.get("content-type") ?? ""
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as unknown as { error: string }
        detail = data.error
      } else {
        const text = await response.text()
        detail = text.slice(0, 200)
      }
    } catch {
      detail = response.statusText
    }
    throw new Error(
      `Upload failed (HTTP ${response.status}): ${detail || response.statusText}`,
    )
  }
}
