import { afterEach, describe, expect, it, vi } from "vitest"

import { handleAssetUpload } from "../handleAssetUpload"

const BASE_UPLOAD = {
  file: new File(["%PDF"], "report.pdf"),
  presignedPutUrl: "https://bucket.example.com/1/uuid/report.pdf",
  contentType: "application/pdf",
  contentDisposition: "inline; filename=report.pdf",
}

describe("handleAssetUpload", () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockClear()
  })

  it("sends the server-signed tagging header", async () => {
    // Arrange
    vi.stubGlobal("fetch", fetchMock)

    // Act
    await handleAssetUpload({ ...BASE_UPLOAD, tagging: "private=true" })

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      BASE_UPLOAD.presignedPutUrl,
      expect.objectContaining({
        headers: expect.objectContaining({ "x-amz-tagging": "private=true" }),
      }),
    )
  })

  it("sends no tagging header when the server signed none", async () => {
    // Arrange
    vi.stubGlobal("fetch", fetchMock)

    // Act
    await handleAssetUpload(BASE_UPLOAD)

    // Assert
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).not.toHaveProperty("x-amz-tagging")
  })
})
