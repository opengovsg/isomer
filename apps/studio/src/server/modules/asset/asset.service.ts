import { randomUUID } from "crypto"
import type { z } from "zod"
import { TRPCError } from "@trpc/server"
import filenamify from "filenamify"

import type { AssetPermissionsProps } from "../permissions/permissions.type"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { env } from "~/env.mjs"
import { deleteFile, generateSignedPutUrl } from "~/lib/s3"
import { db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

// Permissions for assets share the same permissions as resources preferentially
// because the underlying assumption is that the asset is tied to the resource,
// otherwise it will default to the root level permissions of the site
export const validateUserPermissionsForAsset = async ({
  resourceId,
  action,
  userId,
  siteId,
}: AssetPermissionsProps) => {
  if (!resourceId) {
    // No resourceId means that this is a site-level asset
    // so we check for site-level permissions
    await bulkValidateUserPermissionsForResources({
      resourceIds: [],
      action,
      userId,
      siteId,
    })
    return
  }

  const resource = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .where("siteId", "=", siteId)
    .executeTakeFirst()

  if (!resource) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The requested resource does not exist",
    })
  }

  await bulkValidateUserPermissionsForResources({
    resourceIds: [resourceId],
    action,
    userId,
    siteId,
  })
}

type GetFileKeyProps = Pick<
  z.infer<typeof getPresignedPutUrlSchema>,
  "siteId" | "fileName"
>
export const getFileKey = ({ siteId, fileName }: GetFileKeyProps) => {
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
