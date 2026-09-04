import type { Upload as UploadType } from "@aws-sdk/lib-storage"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the env module so we can control whether the audit-log export bucket is
// configured. The bucket name is mutated per-test via the mutable holder below.
const { envHolder } = vi.hoisted(() => {
  const envHolder: {
    NEXT_PUBLIC_S3_REGION: string
    S3_STUDIO_ASSETS_BUCKET_NAME: string | undefined
  } = {
    NEXT_PUBLIC_S3_REGION: "ap-southeast-1",
    S3_STUDIO_ASSETS_BUCKET_NAME: "audit-export-bucket",
  }
  return { envHolder }
})

vi.mock(import('~/env.mjs'), () => ({
  get env() {
    return envHolder
  },
}))

// The upload path streams through lib-storage's `Upload` (multipart-capable),
// not a one-shot PutObjectCommand — mock Upload itself so no real AWS calls
// happen, and capture its constructor options to assert on the S3 params.
const { doneMock, uploadCtorMock } = vi.hoisted(() => ({
  doneMock: vi.fn<(...args: unknown[]) => unknown>(),
  uploadCtorMock: vi.fn<(...args: unknown[]) => unknown>(),
}))
vi.mock(import('@aws-sdk/lib-storage'), () => ({
  Upload: vi.fn<(...args: unknown[]) => unknown>(function (
    options: ConstructorParameters<typeof UploadType>[0],
  ) {
    uploadCtorMock(options)
    return { done: doneMock, on: vi.fn<(...args: unknown[]) => unknown>() }
  }),
}))

const { uploadAuditLogExport } = await import("../s3")

describe("uploadAuditLogExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    envHolder.S3_STUDIO_ASSETS_BUCKET_NAME = "audit-export-bucket"
    doneMock.mockResolvedValue({})
  })

  describe("streams the CSV to the configured bucket with text/csv and attachment disposition", () => {
    let options: ConstructorParameters<typeof UploadType>[0]

    beforeEach(async () => {
      await uploadAuditLogExport({
        key: "site-1/2026-06/access.csv",
        body: "a,b,c\n1,2,3",
      })
      options = uploadCtorMock.mock.calls[0]?.[0] as ConstructorParameters<
        typeof UploadType
      >[0]
    })

    it("constructs one Upload and awaits completion with the expected bucket, key, and body", () => {
      expect(uploadCtorMock).toHaveBeenCalledOnce()
      expect(doneMock).toHaveBeenCalledOnce()
      expect(options.params.Bucket).toBe("audit-export-bucket")
      expect(options.params.Key).toBe("site-1/2026-06/access.csv")
      expect(options.params.Body).toBe("a,b,c\n1,2,3")
    })

    it("sets text/csv content type and attachment disposition from the key basename", () => {
      expect(options.params.ContentType).toBe("text/csv")
      // Filename derived from the key's basename
      expect(options.params.ContentDisposition).toBe(
        `attachment; filename="access.csv"`,
      )
    })
  })

  it("throws a clear error when the bucket env var is unset", async () => {
    // Arrange
    envHolder.S3_STUDIO_ASSETS_BUCKET_NAME = undefined

    // Act + Assert: fails loudly before any upload is even constructed
    await expect(
      uploadAuditLogExport({ key: "site-1/2026-06/access.csv", body: "x" }),
    ).rejects.toThrow("S3_STUDIO_ASSETS_BUCKET_NAME is not configured")
    expect(uploadCtorMock).not.toHaveBeenCalled()
    expect(doneMock).not.toHaveBeenCalled()
  })
})
