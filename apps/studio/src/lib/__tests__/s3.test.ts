import {
  GetObjectTaggingCommand,
  HeadObjectCommand,
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
const { deleteFile, getFileSize } = await import("../s3")

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

describe("getFileSize", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the ContentLength of an existing object", async () => {
    // Arrange
    sendMock.mockResolvedValueOnce({ ContentLength: 4096 })

    // Act
    const size = await getFileSize({ Key: "a/b.csv", Bucket: "test-bucket" })

    // Assert
    expect(size).toBe(4096)
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand)
  })

  it("returns null when the object is genuinely absent (NotFound)", async () => {
    // Arrange: AWS SDK v3 surfaces a missing object as a NotFound error.
    sendMock.mockRejectedValueOnce(
      Object.assign(new Error("Not Found"), {
        name: "NotFound",
        $metadata: { httpStatusCode: 404 },
      }),
    )

    // Act
    const size = await getFileSize({ Key: "gone.csv", Bucket: "test-bucket" })

    // Assert
    expect(size).toBeNull()
  })

  it("returns null for a NoSuchKey error", async () => {
    // Arrange
    sendMock.mockRejectedValueOnce(
      Object.assign(new Error("No such key"), { name: "NoSuchKey" }),
    )

    // Act
    const size = await getFileSize({ Key: "gone.csv", Bucket: "test-bucket" })

    // Assert
    expect(size).toBeNull()
  })

  it("returns null on any error carrying a 404 http status code", async () => {
    // Arrange: a generic error whose only not-found signal is the status code.
    sendMock.mockRejectedValueOnce(
      Object.assign(new Error("nope"), { $metadata: { httpStatusCode: 404 } }),
    )

    // Act
    const size = await getFileSize({ Key: "gone.csv", Bucket: "test-bucket" })

    // Assert
    expect(size).toBeNull()
  })

  it("rethrows a transient (non-404) error instead of reporting the object as gone", async () => {
    // Arrange: a throttling error must NOT be swallowed as null — callers rely
    // on null meaning "genuinely absent", not "we couldn't tell".
    const transientError = Object.assign(new Error("SlowDown"), {
      name: "SlowDown",
      $metadata: { httpStatusCode: 503 },
    })
    sendMock.mockRejectedValueOnce(transientError)

    // Act + Assert
    await expect(
      getFileSize({ Key: "present.csv", Bucket: "test-bucket" }),
    ).rejects.toBe(transientError)
  })
})
