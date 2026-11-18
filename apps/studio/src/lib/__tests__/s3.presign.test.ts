import { beforeAll, describe, expect, it, vi } from "vitest"

import type { generateSignedPutUrl as GenerateSignedPutUrl } from "../s3"

// Uses the real SDK presigner (no S3Client mock) so the test checks the URL
// S3 will actually receive, not just the presigner's input
describe("generateSignedPutUrl", () => {
  let generateSignedPutUrl: typeof GenerateSignedPutUrl

  beforeAll(async () => {
    vi.stubEnv("AWS_ACCESS_KEY_ID", "test-access-key")
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test-secret-key")
    ;({ generateSignedPutUrl } = await import("../s3"))
  })

  it("keeps the tagging header signed instead of moving it into the query string", async () => {
    // Arrange / Act
    const url = new URL(
      await generateSignedPutUrl({
        Bucket: "test-bucket",
        Key: "1/uuid/report.pdf",
        ContentType: "application/pdf",
        ContentDisposition: "inline; filename=report.pdf",
        ContentLength: 4,
        Tagging: "private=true",
      }),
    )

    // Assert: S3 ignores x-amz-tagging in the query string
    expect(url.searchParams.has("x-amz-tagging")).toBe(false)
    expect(url.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toContain(
      "x-amz-tagging",
    )
  })
})
