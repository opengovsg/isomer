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
const { copyFile, deleteFile, setAssetAsPublished } = await import("../s3")

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

  it("URL-encodes the CopySource for keys with reserved characters", async () => {
    // Arrange: gazette keys contain spaces (e.g. "Government Gazette"), which
    // the SDK passes through verbatim in the x-amz-copy-source header.
    sendMock.mockResolvedValue({})
    sendMock.mockResolvedValueOnce({ TagSet: [] })
    sendMock.mockResolvedValueOnce({ ContentType: "application/pdf" })

    // Act
    await setAssetAsPublished({
      Key: "2026/Government Gazette/Notices #1/file.pdf",
      Bucket: "test-bucket",
      ContentDisposition: "inline; filename*=UTF-8''file.pdf",
    })

    // Assert: each path segment is encoded, but the Key itself stays raw
    // (the SDK encodes Key params on its own).
    const copyCommand = sendMock.mock.calls
      .map(([command]) => command as unknown)
      .find((command) => command instanceof CopyObjectCommand)
    expect(copyCommand?.input).toMatchObject({
      CopySource:
        "test-bucket/2026/Government%20Gazette/Notices%20%231/file.pdf",
      Key: "2026/Government Gazette/Notices #1/file.pdf",
    })
  })

  it("skips the self-copy when the disposition is already correct", async () => {
    // Arrange: HeadObject reports the target disposition already set — e.g.
    // a pg-boss retry after an earlier attempt already rewrote it.
    const contentDisposition = "inline; filename*=UTF-8''My%20Gazette.pdf"
    sendMock.mockResolvedValue({})
    sendMock.mockResolvedValueOnce({ TagSet: [] })
    sendMock.mockResolvedValueOnce({
      ContentDisposition: contentDisposition,
    })

    // Act
    await setAssetAsPublished({
      Key: "2024/category/sub/file.pdf",
      Bucket: "test-bucket",
      ContentDisposition: contentDisposition,
    })

    // Assert: no copy issued, but the lock still applies.
    const commands = sendMock.mock.calls.map(([command]) => command as unknown)
    expect(
      commands.some((command) => command instanceof CopyObjectCommand),
    ).toBe(false)
    expect(
      commands.some((command) => command instanceof PutObjectRetentionCommand),
    ).toBe(true)
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

describe("copyFile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("URL-encodes the CopySource for keys with reserved characters", async () => {
    // Arrange
    sendMock.mockResolvedValue({})

    // Act
    await copyFile({
      SourceKey: "2026/Government Gazette/Notices #1/file.pdf",
      DestKey: "2026/Government Gazette/Notices #1/copy.pdf",
      Bucket: "test-bucket",
    })

    // Assert: the copy source is encoded per segment; the destination Key
    // stays raw (the SDK encodes Key params on its own).
    const copyCommand = sendMock.mock.calls[0]?.[0]
    expect(copyCommand).toBeInstanceOf(CopyObjectCommand)
    expect((copyCommand as CopyObjectCommand).input).toMatchObject({
      CopySource:
        "test-bucket/2026/Government%20Gazette/Notices%20%231/file.pdf",
      Key: "2026/Government Gazette/Notices #1/copy.pdf",
    })
  })
})
