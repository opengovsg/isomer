import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"
import { TRPCError } from "@trpc/server"
import { randomUUID } from "crypto"
import filenamify from "filenamify"
import { env } from "~/env.mjs"
import {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
} from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { deleteFile, generateSignedPutUrl } from "~/lib/s3"

import type { AssetPermissionsProps } from "../permissions/permissions.type"
import { db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

// Server-side allowlist: extension (lowercase, e.g. ".jpg") -> MIME (used for signed upload metadata)
const EXTENSION_TO_MIME: Record<string, string> = {
  ...IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  ...FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
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

export const getPresignedPutUrl = async ({
  key,
}: {
  key: string
}): Promise<{
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}> => {
  const contentType = getContentTypeFromKey(key)
  const contentDisposition = getContentDispositionForKey(key)
  const presignedPutUrl = await generateSignedPutUrl({
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentDisposition: contentDisposition,
  })
  return { presignedPutUrl, contentType, contentDisposition }
}

export const markFileAsDeleted = async ({ key }: { key: string }) => {
  return await deleteFile({
    Key: key,
    Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  })
}

const cloudfrontClient = new CloudFrontClient({})
const ssmClient = new SSMClient({})

let cachedDistributionId: string | null = null

const getDistributionId = async (): Promise<string> => {
  if (cachedDistributionId) {
    return cachedDistributionId
  }

  const command = new GetParameterCommand({
    Name: "/cloudfront/assets-distribution-id",
    WithDecryption: false,
  })

  const response = await ssmClient.send(command)
  cachedDistributionId = response.Parameter?.Value ?? null

  // NOTE: if we cannot find the distribution,
  // this is a clear error and we should throw.
  if (!cachedDistributionId) {
    throw new Error("CloudFront Distribution ID is not set in SSM")
  }

  return cachedDistributionId
}

export const invalidateAssetsBySiteIds = async (
  siteIds: string[],
): Promise<{ success: boolean; invalidationId?: string; error?: string }> => {
  if (siteIds.length === 0) {
    return { success: true }
  }

  const sitesToInvalidate = Array.from(new Set(siteIds))

  // Create invalidation paths for each siteId (invalidates all assets under that siteId)
  const paths = Array.from(sitesToInvalidate).map((siteId) => `/${siteId}/*`)

  try {
    const distributionId = await getDistributionId()

    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `delete-assets-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    })

    const response = await cloudfrontClient.send(command)
    return {
      success: true,
      invalidationId: response.Invalidation?.Id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
