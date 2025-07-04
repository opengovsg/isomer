import { randomUUID } from "crypto"
import type { z } from "zod"
import { TRPCError } from "@trpc/server"
import filenamify from "filenamify"

import type { AssetPermissionsProps } from "../permissions/permissions.type"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { env } from "~/env.mjs"
import { deleteFile, generateSignedPutUrl } from "~/lib/s3"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { validateUserPermissionsForSite } from "../site/site.service"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

export const validateUserPermissionsForAsset = async ({
  resourceId,
  action,
  userId,
  siteId,
}: AssetPermissionsProps) => {
  // We're using site permissions for create action
  // If user can read site, they can create assets
  if (action === "create") {
    return await validateUserPermissionsForSite({
      siteId,
      userId,
      action: "read",
    })
  }

  // Permissions for assets share the same permissions as resources
  // because the underlying assumption is that the asset is tied to the resource
  if (!resourceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Resource ID is required to validate asset permissions",
    })
  }
  await bulkValidateUserPermissionsForResources({
    resourceIds: [resourceId],
    action,
    userId,
    siteId,
  })
}

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
