import type {
  CopyObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3"
import {
  CopyObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { env } from "~/env.mjs"

const { S3_REGION, S3_ASSETS_BUCKET_NAME } = env

export const storage = new S3Client({
  region: S3_REGION,
})

export const generateSignedPutUrl = async ({
  Bucket,
  Key,
}: Pick<PutObjectCommandInput, "Bucket" | "Key">): Promise<string> => {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
      Bucket: S3_ASSETS_BUCKET_NAME,
      Key,
    }),
    {
      expiresIn: 60 * 5, // 5 minutes
    },
  )
}

type CopyFileParams = Pick<CopyObjectCommandInput, "Key"> & {
  SourceBucket: CopyObjectCommandInput["Bucket"]
  DestinationBucket: CopyObjectCommandInput["Bucket"]
}

export const copyFile = async ({
  Key,
  SourceBucket,
  DestinationBucket,
}: CopyFileParams) => {
  return storage.send(
    new CopyObjectCommand({
      Bucket: DestinationBucket,
      CopySource: `${SourceBucket}/${Key}`,
      Key,
    }),
  )
}

export const deleteFile = async ({
  Key,
  Bucket,
}: Pick<CopyObjectCommandInput, "Key" | "Bucket">) => {
  return storage.send(
    new CopyObjectCommand({
      Bucket,
      CopySource: `${Bucket}/${Key}`,
      Key,
      MetadataDirective: "REPLACE",
      // NOTE: We perform a soft delete here so the file can be kept available
      // until the page is published
      Metadata: {
        deleted: "true",
      },
    }),
  )
}
