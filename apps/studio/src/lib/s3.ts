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
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "~/env.mjs"

const DELETE_TAG = "deletedAt"
const { NEXT_PUBLIC_S3_REGION } = env

const storage = new S3Client({
  region: NEXT_PUBLIC_S3_REGION,
})

export const generateSignedPutUrl = async ({
  Bucket,
  Key,
  ContentType,
  ContentDisposition,
}: Pick<
  PutObjectCommandInput,
  "Bucket" | "Key" | "ContentType" | "ContentDisposition"
>): Promise<string> => {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
      Bucket,
      Key,
      ContentType,
      ContentDisposition,
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
