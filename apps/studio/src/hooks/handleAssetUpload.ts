interface HandleUploadParams {
  file: File
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}

// Some virtualised/secure browser proxies (e.g. Menlo, SafeSurf) swallow the
// PUT entirely, so it never rejects or resolves (ISOM-2680). Without a
// deadline that hang is silent forever instead of a catchable, reportable
// error.
const UPLOAD_TIMEOUT_MS = 60_000

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
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })

  if (!response.ok) {
    const data = (await response.json()) as unknown as { error: string }
    throw new Error(data.error)
  }
}
