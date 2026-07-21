import {
  CopyObjectCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  PutObjectRetentionCommand,
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
const { deleteFile, setAssetAsPublished } = await import("../s3")

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

describe("setAssetAsPublished", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rewrites Content-Disposition via a self-copy before applying the retention lock", async () => {
    // Arrange: clean scan tags, then a HeadObject response whose metadata the
    // self-copy must re-supply (MetadataDirective REPLACE drops it otherwise).
    sendMock.mockResolvedValue({})
    sendMock.mockResolvedValueOnce({
      TagSet: [
        { Key: "GuardDutyMalwareScanStatus", Value: "NO_THREATS_FOUND" },
      ],
    })
    sendMock.mockResolvedValueOnce({
      ContentType: "application/pdf",
      Metadata: { foo: "bar" },
    })
    const contentDisposition = "inline; filename*=UTF-8''My%20Gazette.pdf"

    // Act
    await setAssetAsPublished({
      Key: "2024/category/sub/file.pdf",
      Bucket: "test-bucket",
      ContentDisposition: contentDisposition,
    })

    // Assert: the self-copy replaces the disposition, preserves the object's
    // content type + metadata, and runs before the (irreversible) lock.
    const commands = sendMock.mock.calls.map(([command]) => command as unknown)
    expect(commands[1]).toBeInstanceOf(HeadObjectCommand)
    const copyIndex = commands.findIndex(
      (command) => command instanceof CopyObjectCommand,
    )
    const retentionIndex = commands.findIndex(
      (command) => command instanceof PutObjectRetentionCommand,
    )
    expect(copyIndex).toBeGreaterThan(-1)
    expect(retentionIndex).toBeGreaterThan(copyIndex)
    const copyCommand = commands[copyIndex] as CopyObjectCommand
    expect(copyCommand.input).toMatchObject({
      CopySource: "test-bucket/2024/category/sub/file.pdf",
      Key: "2024/category/sub/file.pdf",
      MetadataDirective: "REPLACE",
      ContentType: "application/pdf",
      Metadata: { foo: "bar" },
      ContentDisposition: contentDisposition,
    })
  })

  it("skips the self-copy when no ContentDisposition is given", async () => {
    // Arrange
    sendMock.mockResolvedValue({})
    sendMock.mockResolvedValueOnce({ TagSet: [] })

    // Act
    await setAssetAsPublished({
      Key: "2024/category/sub/file.pdf",
      Bucket: "test-bucket",
    })

    // Assert: no HeadObject/CopyObject issued, but the lock still applies.
    const commands = sendMock.mock.calls.map(([command]) => command as unknown)
    expect(
      commands.some((command) => command instanceof CopyObjectCommand),
    ).toBe(false)
    expect(
      commands.some((command) => command instanceof PutObjectRetentionCommand),
    ).toBe(true)
  })
})
