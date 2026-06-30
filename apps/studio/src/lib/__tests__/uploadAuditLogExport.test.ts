import { PutObjectCommand } from "@aws-sdk/client-s3"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the env module so we can control whether the audit-log export bucket is
// configured. The bucket name is mutated per-test via the mutable holder below.
const { envHolder } = vi.hoisted(() => ({
  envHolder: {
    NEXT_PUBLIC_S3_REGION: "ap-southeast-1",
    S3_AUDIT_LOG_EXPORT_BUCKET_NAME: "audit-export-bucket" as
      | string
      | undefined,
  },
}))

vi.mock("~/env.mjs", () => ({
  get env() {
    return envHolder
  },
}))

// Mock the S3 client so no real AWS calls happen, while keeping the real
// command classes so we can assert on the dispatched command's input.
const sendMock = vi.fn()
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>()
  return {
    ...actual,
    S3Client: vi.fn(function () {
      return { send: sendMock }
    }),
  }
})

const { uploadAuditLogExport } = await import("../s3")

describe("uploadAuditLogExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    envHolder.S3_AUDIT_LOG_EXPORT_BUCKET_NAME = "audit-export-bucket"
    sendMock.mockResolvedValue({})
  })

  it("puts the CSV to the configured bucket with text/csv and attachment disposition", async () => {
    // Act
    await uploadAuditLogExport({
      key: "site-1/2026-06/access.csv",
      body: "a,b,c\n1,2,3",
    })

    // Assert
    expect(sendMock).toHaveBeenCalledTimes(1)
    const command = sendMock.mock.calls[0]?.[0]
    expect(command).toBeInstanceOf(PutObjectCommand)

    const input = (command as PutObjectCommand).input
    expect(input.Bucket).toBe("audit-export-bucket")
    expect(input.Key).toBe("site-1/2026-06/access.csv")
    expect(input.ContentType).toBe("text/csv")
    // Filename derived from the key's basename
    expect(input.ContentDisposition).toBe(`attachment; filename="access.csv"`)
  })

  it("throws a clear error when the bucket env var is unset", async () => {
    // Arrange
    envHolder.S3_AUDIT_LOG_EXPORT_BUCKET_NAME = undefined

    // Act + Assert
    await expect(
      uploadAuditLogExport({ key: "site-1/2026-06/access.csv", body: "x" }),
    ).rejects.toThrow("S3_AUDIT_LOG_EXPORT_BUCKET_NAME is not configured")
    expect(sendMock).not.toHaveBeenCalled()
  })
})
