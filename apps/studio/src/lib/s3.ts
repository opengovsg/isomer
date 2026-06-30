import type {
  CopyObjectCommandInput,
  GetObjectCommandInput,
  HeadObjectCommandInput,
  PutObjectCommandInput,
  PutObjectTaggingCommandInput,
} from "@aws-sdk/client-s3"
import {
  CopyObjectCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectRetentionCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { addDays } from "date-fns"
import { env } from "~/env.mjs"

const DELETE_TAG = "deletedAt"
const EGAZETTE_COMPLIANCE_HOLD_IN_DAYS = 10000
const { NEXT_PUBLIC_S3_REGION } = env

const storage = new S3Client({
  region: NEXT_PUBLIC_S3_REGION,
})

export const generateSignedPutUrl = async ({
  Bucket,
  Key,
  ContentType,
  ContentDisposition,
  Tagging,
}: Pick<
  PutObjectCommandInput,
  "Bucket" | "Key" | "ContentType" | "ContentDisposition" | "Tagging"
>): Promise<string> => {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
      Bucket,
      Key,
      ContentType,
      ContentDisposition,
      Tagging,
    }),
    {
      expiresIn: 60 * 5, // 5 minutes
      // Sign these headers so S3 rejects PUTs with different values (prevents type-confusion XSS)
      signableHeaders: new Set(["content-type", "content-disposition"]),
    },
  )
}

export const generateSignedGetUrl = async ({
  Bucket,
  Key,
}: Pick<GetObjectCommandInput, "Bucket" | "Key">): Promise<string> => {
  return getSignedUrl(
    storage,
    new GetObjectCommand({
      Bucket,
      Key,
    }),
    {
      expiresIn: 60 * 5, // 5 minutes
    },
  )
}

export const deleteFile = async ({
  Key,
  Bucket,
}: Pick<PutObjectTaggingCommandInput, "Key" | "Bucket">) => {
  // Belt-and-suspenders: assetStorage routes to VercelBlobAssetStorage in
  // preview (already a no-op), but this guard also protects any direct callers.
  if (env.NEXT_PUBLIC_APP_ENV === "preview") return
  const objectTag = await storage.send(
    new GetObjectTaggingCommand({
      Bucket,
      Key,
    }),
  )

  const originalTagSet = objectTag.TagSet ?? []

  return storage.send(
    new PutObjectTaggingCommand({
      Bucket,
      Key,
      // NOTE: We perform a soft delete here so the file can be kept available
      // until the page is published
      Tagging: {
        TagSet: [
          ...originalTagSet.filter(({ Key }) => Key !== DELETE_TAG),
          {
            Key: DELETE_TAG,
            // NOTE: milliseconds since epoch
            Value: Date.now().toString(),
          },
        ],
      },
    }),
  )
}

// NOTE: In order to set the asset as published, we have to do 2 things:
// 1. we have to set the object lock retention
// 2. we have to remove the scheduledAt tag
// this is required to guarantee that the gazettes
// can be seen and cannot be deleted
export const setAssetAsPublished = async ({
  Key,
  Bucket,
}: Pick<PutObjectTaggingCommandInput, "Key" | "Bucket">) => {
  if (env.NEXT_PUBLIC_APP_ENV === "preview") return
  const objectTag = await storage.send(
    new GetObjectTaggingCommand({
      Bucket,
      Key,
    }),
  )

  const originalTagSet = objectTag.TagSet ?? []

  // NOTE: All published gazettes are immutable so we need to retain this guarantee
  // without risk of malware being hosted.
  // We do this by disallowing the publish if the malware scan did not succeed
  // for any reason.
  // If malware was detected, this will also trip a datadog notification
  const hasFailedScan = originalTagSet.some(
    (tag) =>
      tag.Key === "GuardDutyMalwareScanStatus" &&
      tag.Value !== "NO_THREATS_FOUND",
  )
  if (hasFailedScan) {
    throw new Error("Cannot publish asset with failed malware scan")
  }

  // NOTE: Lock first to preserve guarantee that once published
  // the gazette cannot be deleted
  await storage.send(
    new PutObjectRetentionCommand({
      Bucket,
      Key,
      Retention: {
        // COMPLIANCE in prod hard-locks the object until RetainUntilDate —
        // even the root account cannot delete or overwrite it. Non-prod uses
        // GOVERNANCE so dev/staging buckets don't accumulate test gazettes
        // that are unremovable for the full retention window.
        Mode:
          env.NEXT_PUBLIC_APP_ENV === "production"
            ? "COMPLIANCE"
            : "GOVERNANCE",
        // 10000 days from time of publish
        RetainUntilDate: addDays(new Date(), EGAZETTE_COMPLIANCE_HOLD_IN_DAYS),
      },
    }),
  )

  await storage.send(
    new PutObjectTaggingCommand({
      Bucket,
      Key,
      // NOTE: We perform a soft delete here so the file can be kept available
      // until the page is published
      Tagging: {
        TagSet: [...originalTagSet.filter(({ Key }) => Key !== "scheduledAt")],
      },
    }),
  )

  return
}

export const getFileSize = async ({
  Key,
  Bucket,
}: Pick<HeadObjectCommandInput, "Key" | "Bucket">): Promise<number | null> => {
  try {
    const response = await storage.send(new HeadObjectCommand({ Bucket, Key }))
    return response.ContentLength ?? null
  } catch {
    return null
  }
}

export const copyFile = async ({
  SourceKey,
  DestKey,
  Bucket,
}: Pick<CopyObjectCommandInput, "Bucket"> & {
  SourceKey: string
  DestKey: string
}) => {
  return storage.send(
    new CopyObjectCommand({
      Bucket,
      CopySource: `${Bucket}/${SourceKey}`,
      Key: DestKey,
    }),
  )
}

export const markScheduledAssetAsCancelled = async ({
  Key,
  Bucket,
}: Pick<PutObjectTaggingCommandInput, "Key" | "Bucket">) => {
  if (env.NEXT_PUBLIC_APP_ENV === "preview") return
  const objectTag = await storage.send(
    new GetObjectTaggingCommand({
      Bucket,
      Key,
    }),
  )

  const originalTagSet = objectTag.TagSet ?? []
  // Preserve an existing deletedAt timestamp — the file may have been
  // soft-deleted before, and the original deletion time is more meaningful
  // than the cancellation moment.
  const existingDeletedAt = originalTagSet.find(
    ({ Key }) => Key === DELETE_TAG,
  )?.Value

  return storage.send(
    new PutObjectTaggingCommand({
      Bucket,
      Key,
      // NOTE: Remove scheduledAt tag and set deletedAt tag to mark the asset as cancelled
      Tagging: {
        TagSet: [
          ...originalTagSet.filter(
            ({ Key }) => Key !== "scheduledAt" && Key !== DELETE_TAG,
          ),
          {
            Key: DELETE_TAG,
            Value: existingDeletedAt ?? Date.now().toString(),
          },
        ],
      },
    }),
  )
}

export const getBlob = async (bucketName: string, key: string) => {
  try {
    const data = await storage.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key }),
    )
    const byteArr = await data.Body?.transformToByteArray()
    if (!byteArr) {
      throw new Error("Error when transforming blob to byte array")
    }
    return byteArr
  } catch (err) {
    console.error({
      message: "Error when getting blob",
      error: err,
      merged: { bucketName, key },
    })
    throw err
  }
}
