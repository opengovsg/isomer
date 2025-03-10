import { randomUUID } from "crypto"
import type { z } from "zod"

import type { SitePermissionsProps } from "../site/site.service"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { env } from "~/env.mjs"
import { deleteFile, generateSignedPutUrl } from "~/lib/s3"
import { validateUserPermissionsForSite } from "../site/site.service"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

// Reusing site permissions since all users can create assets
// Creating a wrapper as a reminder to update if we will to introduce a READ-only role
export const validateUserPermissionsForAsset = async ({
  siteId,
  action,
  userId,
}: SitePermissionsProps) => {
  await validateUserPermissionsForSite({ siteId, action, userId })
}

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
