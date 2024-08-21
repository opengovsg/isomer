import type {
  PutObjectCommandInput,
  PutObjectTaggingCommandInput,
} from "@aws-sdk/client-s3"
import {
  GetObjectTaggingCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { env } from "~/env.mjs"

const { NEXT_PUBLIC_S3_REGION } = env

export const storage = new S3Client({
  region: NEXT_PUBLIC_S3_REGION,
})

export const generateSignedPutUrl = async ({
  Bucket,
  Key,
}: Pick<PutObjectCommandInput, "Bucket" | "Key">): Promise<string> => {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
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
          ...originalTagSet.filter(({ Key }) => Key !== "ISOMER_STATUS"),
          {
            Key: "ISOMER_STATUS",
            Value: "DELETED",
          },
        ],
      },
    }),
  )
}
