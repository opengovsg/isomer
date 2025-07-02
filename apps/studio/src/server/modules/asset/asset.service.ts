import { randomUUID } from "crypto"
import type { z } from "zod"
import filenamify from "filenamify"

import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { env } from "~/env.mjs"
import { deleteFile, generateSignedPutUrl } from "~/lib/s3"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

export const getFileKey = ({
  siteId,
  fileName,
}: z.infer<typeof getPresignedPutUrlSchema>) => {
  // NOTE: We're using a random folder name to prevent collisions
  const folderName = randomUUID()
  const sanitizedFileName = filenamify(fileName, { replacement: "-" })

  return `${siteId}/${folderName}/${sanitizedFileName}`
}

export const getPresignedPutUrl = async ({ key }: { key: string }) => {
  return generateSignedPutUrl({
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
    Key: key,
  })
}

export const markFileAsDeleted = async ({ key }: { key: string }) => {
  await deleteFile({
    Key: key,
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  })
}
