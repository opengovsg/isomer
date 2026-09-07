import type { Upload as UploadType } from "@aws-sdk/lib-storage"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  resetStudioAssetsBucketNameForTests,
  resetUploadClassForTests,
  setStudioAssetsBucketNameForTests,
  setUploadClassForTests,
  uploadAuditLogExport,
} from "../s3"

// The upload path streams through lib-storage's `Upload` (multipart-capable),
// not a one-shot PutObjectCommand — inject Upload so no real AWS calls happen,
// and capture its constructor options to assert on the S3 params.
const doneMock = vi.fn()
const uploadCtorMock = vi.fn()

beforeEach(() => {
  setStudioAssetsBucketNameForTests("audit-export-bucket")
  setUploadClassForTests(
    // @ts-expect-error test stub implements only the Upload constructor surface used by uploadAuditLogExport
    function MockUpload(options: ConstructorParameters<typeof UploadType>[0]) {
      uploadCtorMock(options)
      return { done: doneMock, on: vi.fn() }
    },
  )
  vi.clearAllMocks()
  doneMock.mockResolvedValue({})
})

afterAll(() => {
  resetStudioAssetsBucketNameForTests()
  resetUploadClassForTests()
})

describe("uploadAuditLogExport", () => {
  it("streams the CSV to the configured bucket with text/csv and attachment disposition", async () => {
    // Act
    await uploadAuditLogExport({
      body: "a,b,c\n1,2,3",
      key: "site-1/2026-06/access.csv",
    })

    // Assert: one Upload, awaited to completion, with the expected S3 params
    expect(uploadCtorMock).toHaveBeenCalledTimes(1)
    expect(doneMock).toHaveBeenCalledTimes(1)

    // SAFETY: uploadCtorMock is wired to the Upload constructor under test
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    const options = uploadCtorMock.mock.calls[0]?.[0] as ConstructorParameters<
      typeof UploadType
    >[0]
    expect(options.params.Bucket).toBe("audit-export-bucket")
    expect(options.params.Key).toBe("site-1/2026-06/access.csv")
    expect(options.params.Body).toBe("a,b,c\n1,2,3")
    expect(options.params.ContentType).toBe("text/csv")
    // Filename derived from the key's basename
    expect(options.params.ContentDisposition).toBe(
      `attachment; filename="access.csv"`,
    )
  })

  it("throws a clear error when the bucket env var is unset", async () => {
    // Arrange
    setStudioAssetsBucketNameForTests("")

    // Act + Assert: fails loudly before any upload is even constructed
    await expect(
      uploadAuditLogExport({ body: "x", key: "site-1/2026-06/access.csv" }),
    ).rejects.toThrow("S3_STUDIO_ASSETS_BUCKET_NAME is not configured")
    expect(uploadCtorMock).not.toHaveBeenCalled()
    expect(doneMock).not.toHaveBeenCalled()
  })
})
