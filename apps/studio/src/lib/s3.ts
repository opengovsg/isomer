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

// R2 credentials are only set for preview, but the choice of backend is
// driven by their presence rather than the environment name. Exported so
// other modules don't have to re-derive this from the raw env vars.
export const isR2Configured = !!(
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY
)

// Signed download URLs for audit log exports are valid for 3 days, matching
// the object lifecycle on the audit-log export bucket. Exposed so the
// orchestrator (next layer) can sign URLs against the same bucket with a
// consistent expiry.
export const AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 3

const storage = new S3Client(
  isR2Configured
    ? {
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
          secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
        },
      }
    : { region: env.NEXT_PUBLIC_S3_REGION },
)

export const generateSignedPutUrl = async ({
  Bucket,
  Key,
  ContentType,
  ContentDisposition,
  ContentLength,
  Tagging,
}: Pick<
  PutObjectCommandInput,
  | "Bucket"
  | "Key"
  | "ContentType"
  | "ContentDisposition"
  | "ContentLength"
  | "Tagging"
>): Promise<string> => {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
      Bucket,
      Key,
      ContentType,
      ContentDisposition,
      ContentLength,
      Tagging,
    }),
    {
      expiresIn: 60 * 5, // 5 minutes
      // Sign these headers so S3 rejects PUTs with different values (prevents type-confusion XSS and enforces exact upload size)
      signableHeaders: new Set([
        "content-type",
        "content-disposition",
        "content-length",
      ]),
    },
  )
}

export const generateSignedGetUrl = async (
  { Bucket, Key }: Pick<GetObjectCommandInput, "Bucket" | "Key">,
  // Default kept at 5 minutes so all existing callers are unchanged.
  expiresIn: number = 60 * 5,
): Promise<string> => {
  return getSignedUrl(
    storage,
    new GetObjectCommand({
      Bucket,
      Key,
    }),
    {
      expiresIn,
    },
  )
}

export const deleteFile = async ({
  Key,
  Bucket,
}: Pick<PutObjectTaggingCommandInput, "Key" | "Bucket">) => {
  // R2 doesn't implement the S3 object tagging API (GetObjectTagging/
  // PutObjectTagging), so this soft-delete tagging can't work there anyway.
  // It's also tied to the scheduled-publishing/gazette retention workflow,
  // which is meaningless for ephemeral preview data, so skip to a no-op.
  if (isR2Configured) return
  const objectTag = await storage.send(
    new GetObjectTaggingCommand({
      Bucket,
      Key,
    }),
  )

  const originalTagSet = objectTag.TagSet ?? []

  // If the file is already soft-deleted, short-circuit and skip the (paid,
  // expensive) PutObjectTagging call. The cheap GetObjectTagging above is
  // unavoidable, but re-tagging an already-deleted key would only overwrite
  // the original deletion timestamp with a fresh one — so skipping is both
  // cheaper and more correct (it preserves the original deletedAt).
  const isAlreadyDeleted = originalTagSet.some(({ Key }) => Key === DELETE_TAG)
  if (isAlreadyDeleted) {
    return
  }

  return storage.send(
    new PutObjectTaggingCommand({
      Bucket,
      Key,
      // NOTE: We perform a soft delete here so the file can be kept available
      // until the page is published
      Tagging: {
        TagSet: [
          ...originalTagSet,
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
  // Skip on R2: the COMPLIANCE-mode Object Lock below is irreversible for
  // ~27 years — applying it to a shared preview bucket would permanently
  // lock every test upload. The GuardDuty malware-scan tag check is also
  // moot, since GuardDuty is an AWS-only service that never scans R2 objects.
  if (isR2Configured) return
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
  // R2 doesn't implement the S3 object tagging API, so this can't work
  // there anyway. It's also tied to the scheduled-publishing workflow,
  // which is meaningless for ephemeral preview data.
  if (isR2Configured) return
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

export const putObjectDirect = async (
  props: Pick<
    PutObjectCommandInput,
    "Bucket" | "Key" | "Body" | "ContentType" | "ContentDisposition" | "Tagging"
  >,
): Promise<void> => {
  await storage.send(new PutObjectCommand(props))
}

// Resolves the private bucket that holds audit-log CSV exports. Throws a clear
// error if the env var is unset, so misconfiguration fails loudly at call time
// rather than silently uploading to `undefined`. Exposed so the orchestrator
// (next layer) can build keys / sign URLs against the same bucket.
export const getAuditLogExportBucketName = (): string => {
  const bucket = env.S3_STUDIO_ASSETS_BUCKET_NAME
  if (!bucket) {
    throw new Error("S3_STUDIO_ASSETS_BUCKET_NAME is not configured")
  }
  return bucket
}

// Uploads a generated audit-log CSV export to the private audit-log bucket.
// The download disposition uses the key's basename as the filename so the
// browser saves a sensibly-named .csv rather than the full object key.
export const uploadAuditLogExport = async ({
  key,
  body,
}: {
  key: string
  body: PutObjectCommandInput["Body"]
}): Promise<void> => {
  const Bucket = getAuditLogExportBucketName()
  const filename = key.split("/").pop() ?? key
  await putObjectDirect({
    Bucket,
    Key: key,
    Body: body,
    ContentType: "text/csv",
    ContentDisposition: `attachment; filename="${filename}"`,
  })
}
