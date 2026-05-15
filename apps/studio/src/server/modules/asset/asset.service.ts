import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { randomUUID } from "crypto"
import filenamify from "filenamify"
import { env } from "~/env.mjs"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import {
  deleteFile,
  generateSignedGetUrl,
  generateSignedPutUrl,
} from "~/lib/s3"

import type { AssetPermissionsProps } from "../permissions/permissions.type"
import { db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

// Server-side allowlist: extension (lowercase, e.g. ".jpg") -> MIME (used for signed upload metadata)
const EXTENSION_TO_MIME: Record<string, string> = {
  ...IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  ...FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
}

// NOTE: The format that s3 expects is in this format:
// Tagging: "key1=value1&key2=value2"
export const generateTagsQueryString = (tags: { key: string; value: string }[]) => {
  const entries = tags.map(({ key, value }) => `${key}=${value}`)
  return entries.join("&")
}

/**
 * Derive trusted Content-Type from key. Key is only produced after schema validation,
 * so the file extension is always from the allowlist.
 */
export const getContentTypeFromKey = (key: string): string => {
  const segment = key.split("/").pop() ?? ""
  const lower = segment.toLowerCase()
  const ext = lower.includes(".") ? lower.substring(lower.lastIndexOf(".")) : ""
  return EXTENSION_TO_MIME[ext] ?? "application/octet-stream"
}

/**
 * Build Content-Disposition for signed upload (inline; filename for download hint).
 */
export const getContentDispositionForKey = (key: string): string => {
  const segment = key.split("/").pop() ?? ""
  const encoded = encodeURIComponent(segment)
  return `inline; filename*=UTF-8''${encoded}`
}

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

export const doAllFileKeysBelongToSite = ({
  fileKeys,
  siteId,
}: {
  fileKeys: string[]
  siteId: number
}) => {
  return fileKeys.every((key) => key.startsWith(`${siteId}/`))
}

export const getPresignedPutUrl = async ({
  key,
  tags,
}: {
  key: string
  tags?: { key: string; value: string }[]
}): Promise<{
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}> => {
  const contentType = getContentTypeFromKey(key)
  const contentDisposition = getContentDispositionForKey(key)
  const stringifiedTags = tags && generateTagsQueryString(tags)
  const presignedPutUrl = await generateSignedPutUrl({
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentDisposition: contentDisposition,
    Tagging: tags && stringifiedTags,
  })
  return { presignedPutUrl, contentType, contentDisposition }
}

export const markFileAsDeleted = async ({ key }: { key: string }) => {
  await deleteFile({
    Key: key,
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  })
}

export const getPresignedGetUrl = async ({
  key,
}: {
  key: string
}): Promise<string> => {
  return generateSignedGetUrl({
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
    Key: key,
  })
}

