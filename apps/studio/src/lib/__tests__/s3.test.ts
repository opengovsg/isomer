import {
  GetObjectTaggingCommand,
  PutObjectTaggingCommand,
} from "@aws-sdk/client-s3"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the S3 client so we can observe which commands are dispatched without
// hitting AWS. We keep the real command classes so we can assert on instances.
const sendMock = vi.fn()
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>()
  return {
    ...actual,
    // Use a regular function (not an arrow) so it can be invoked with `new`,
    // since s3.ts constructs the client via `new S3Client(...)`.
    S3Client: vi.fn(function () {
      return { send: sendMock }
    }),
  }
})

// Imported after the mock is registered so the module-level S3Client is mocked.
const { deleteFile } = await import("../s3")

const DELETE_TAG = "deletedAt"

describe("deleteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("performs a PutObjectTagging with a deletedAt tag for a non-deleted file", async () => {
    // Arrange: file has an unrelated tag but no deletedAt
    sendMock.mockResolvedValueOnce({
      TagSet: [
        { Key: "GuardDutyMalwareScanStatus", Value: "NO_THREATS_FOUND" },
      ],
    })

    // Act
    await deleteFile({ Key: "1/uuid/file.png", Bucket: "test-bucket" })

    // Assert: one Get followed by one Put
    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectTaggingCommand)

    const putCommand = sendMock.mock.calls[1]?.[0]
    expect(putCommand).toBeInstanceOf(PutObjectTaggingCommand)
    const tagSet = (putCommand as PutObjectTaggingCommand).input.Tagging?.TagSet
    // Preserves the existing tag and adds the deletedAt tag
    expect(tagSet).toContainEqual({
      Key: "GuardDutyMalwareScanStatus",
      Value: "NO_THREATS_FOUND",
    })
    expect(tagSet?.some(({ Key }) => Key === DELETE_TAG)).toBe(true)
  })

  it("skips the (paid) PutObjectTagging when the file is already soft-deleted", async () => {
    // Arrange: file already carries a deletedAt tag
    sendMock.mockResolvedValueOnce({
      TagSet: [{ Key: DELETE_TAG, Value: "1700000000000" }],
    })

    // Act
    await deleteFile({ Key: "1/uuid/file.png", Bucket: "test-bucket" })

    // Assert: only the cheap Get ran, no Put
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectTaggingCommand)
    expect(
      sendMock.mock.calls.some(
        ([command]) => command instanceof PutObjectTaggingCommand,
      ),
    ).toBe(false)
  })
})
