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
const sendMock = vi.fn<(...args: unknown[]) => unknown>()
vi.mock(import('@aws-sdk/client-s3'), async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>()
  return {
    ...actual,
    // Use a regular function (not an arrow) so it can be invoked with `new`,
    // since s3.ts constructs the client via `new S3Client(...)`.
    S3Client: vi.fn<(...args: unknown[]) => unknown>(function () {
      return { send: sendMock }
    }),
  }
})

// Imported after the mock is registered so the module-level S3Client is mocked.
const { copyFile, deleteFile, setAssetAsPublished, getFileSize } =
  await import("../s3")

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
    expect(sendMock).toHaveBeenCalledOnce()
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
    const commands = sendMock.mock.calls.map(([command]) => command)
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
      .map(([command]) => command)
      .find((command) => command instanceof CopyObjectCommand)
    expect(copyCommand?.input).toMatchObject({
      CopySource:
        "test-bucket/2026/Government%20Gazette/Notices%20%231/file.pdf",
      Key: "2026/Government Gazette/Notices #1/file.pdf",
    })
  })

  it("omits ContentType/Metadata from the self-copy when HeadObject didn't return them", async () => {
    // Arrange: HeadObject with no ContentType/Metadata set (e.g. an object
    // uploaded without either). Passing them through as explicit `undefined`
    // values (rather than omitting the keys) is a known aws-sdk-js-v3
    // SignatureDoesNotMatch trigger on CopyObjectCommand.
    sendMock.mockResolvedValue({})
    sendMock.mockResolvedValueOnce({ TagSet: [] })
    sendMock.mockResolvedValueOnce({})

    // Act
    await setAssetAsPublished({
      Key: "2024/category/sub/file.pdf",
      Bucket: "test-bucket",
      ContentDisposition: "inline; filename*=UTF-8''My%20Gazette.pdf",
    })

    // Assert
    const copyCommand = sendMock.mock.calls
      .map(([command]) => command)
      .find((command) => command instanceof CopyObjectCommand)
    expect(copyCommand).toBeDefined()
    expect(copyCommand?.input).not.toHaveProperty("ContentType")
    expect(copyCommand?.input).not.toHaveProperty("Metadata")
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
    const commands = sendMock.mock.calls.map(([command]) => command)
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
    const commands = sendMock.mock.calls.map(([command]) => command)
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
