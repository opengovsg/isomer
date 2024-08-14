import { randomUUID } from "crypto"
import type { z } from "zod"

import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { env } from "~/env.mjs"
import { deleteFile, generateSignedPutUrl } from "~/lib/s3"

const { S3_UNSAFE_ASSETS_BUCKET_NAME, S3_PUBLIC_ASSETS_BUCKET_NAME } = env

export const getFileKey = ({
  siteId,
  fileName,
}: z.infer<typeof getPresignedPutUrlSchema>) => {
  // NOTE: We're using a random folder name to prevent collisions
  const folderName = randomUUID()

  return `${siteId}/${folderName}/${fileName}`
}

export const getPresignedPutUrl = async ({ key }: { key: string }) => {
  return generateSignedPutUrl({
    Bucket: S3_UNSAFE_ASSETS_BUCKET_NAME,
    Key: key,
  })
}

export const markFileAsDeleted = async ({ key }: { key: string }) => {
  await deleteFile({
    Key: key,
    Bucket: S3_PUBLIC_ASSETS_BUCKET_NAME,
  })
}
