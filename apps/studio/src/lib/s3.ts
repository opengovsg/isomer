import type { PutObjectCommandInput } from "@aws-sdk/client-s3"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { env } from "~/env.mjs"

const { S3_REGION, S3_UNSAFE_ASSETS_BUCKET_NAME } = env

export const storage = new S3Client({
  region: S3_REGION,
})

export const generateSignedPutUrl = async ({
  Key,
}: Pick<PutObjectCommandInput, "Key">): Promise<string> => {
  return getSignedUrl(
    storage,
    new PutObjectCommand({
      Bucket: S3_UNSAFE_ASSETS_BUCKET_NAME,
      Key,
    }),
    {
      expiresIn: 60 * 5, // 5 minutes
    },
  )
}
