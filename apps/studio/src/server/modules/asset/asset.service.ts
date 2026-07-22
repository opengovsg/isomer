import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { randomUUID } from "crypto"
import filenamify from "filenamify"
import { env } from "~/env.mjs"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/lib/fileUpload"
import { createBaseLogger } from "~/lib/logger"
import {
  deleteFile,
  generateSignedGetUrl,
  generateSignedPutUrl,
  putObjectDirect,
} from "~/lib/s3"
import { getServerDomPurify } from "~/lib/server-dom-purify"

import type { AssetPermissionsProps } from "../permissions/permissions.type"
import { db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"

const logger = createBaseLogger({ path: "asset.service" })
const bucket = env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME

export interface UploadConfig {
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}

// Server-side allowlist: extension (lowercase, e.g. ".jpg") -> MIME (used for signed upload metadata)
const EXTENSION_TO_MIME: Record<string, string> = {
  ...IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  ...FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
}

// NOTE: The format that s3 expects is in this format:
// Tagging: "key1=value1&key2=value2"
export const generateTagsQueryString = (
  tags: { key: string; value: string }[],
) => {
  const entries = tags.map(({ key, value }) => `${key}=${value}`)
  return entries.join("&")
}

const getFilenameFromKey = (key: string): string => key.split("/").pop() ?? ""

const getExtensionFromFilename = (filename: string): string =>
  filename.includes(".") ? filename.substring(filename.lastIndexOf(".")) : ""

/**
 * Derive trusted Content-Type from key. Key is only produced after schema validation,
 * so the file extension is always from the allowlist.
 */
export const getContentTypeFromKey = (key: string): string => {
  const ext = getExtensionFromFilename(getFilenameFromKey(key).toLowerCase())
  return EXTENSION_TO_MIME[ext] ?? "application/octet-stream"
}

/**
 * Build Content-Disposition for signed upload (inline; filename for download hint).
 */
export const getContentDispositionForKey = (key: string): string => {
  const encoded = encodeURIComponent(getFilenameFromKey(key))
  return `inline; filename*=UTF-8''${encoded}`
}

/**
 * Build Content-Disposition using a human-readable title as the download
 * filename, keeping the key's extension so the saved file still opens in
 * the right application.
 */
export const getContentDispositionForTitle = (
  title: string,
  key: string,
): string => {
  const extension = getExtensionFromFilename(getFilenameFromKey(key))
  const encoded = encodeURIComponent(`${title}${extension}`)
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
  fileSize,
  tags,
}: {
  key: string
  fileSize: number
  tags?: { key: string; value: string }[]
}): Promise<UploadConfig> => {
  const contentType = getContentTypeFromKey(key)
  const contentDisposition = getContentDispositionForKey(key)
  const presignedPutUrl = await generateSignedPutUrl({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentDisposition: contentDisposition,
    ContentLength: fileSize,
    Tagging: tags && generateTagsQueryString(tags),
  })
  return { presignedPutUrl, contentType, contentDisposition }
}

export const markFileAsDeleted = async ({ key }: { key: string }) => {
  await deleteFile({ Key: key, Bucket: bucket })
}

export const getPresignedGetUrl = async ({
  key,
}: {
  key: string
}): Promise<string> => {
  return generateSignedGetUrl({ Bucket: bucket, Key: key })
}

export const sanitizeSvg = (content: string): string => {
  // Must run BEFORE parsing. Entity expansion (e.g. billion-laughs) happens
  // inside DOMParser.parseFromString — DOMPurify only sees the resulting DOM
  // and cannot intercept it. No sanitization library operates at this layer.
  if (/<!ENTITY/i.test(content)) {
    logger.error("SVG rejected: contains disallowed XML entities")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "SVG contains disallowed XML entities",
    })
  }

  const { DOMParser, DOMPurify } = getServerDomPurify()

  const doc = new DOMParser().parseFromString(content, "image/svg+xml")

  if (doc.getElementsByTagName("parsererror").length > 0) {
    logger.error("SVG rejected: failed to parse as valid XML")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "SVG failed to parse as valid XML",
    })
  }

  const root = doc.documentElement
  if (
    root.localName !== "svg" ||
    root.namespaceURI !== "http://www.w3.org/2000/svg"
  ) {
    logger.error(
      { localName: root.localName, namespaceURI: root.namespaceURI },
      "SVG rejected: root element is not a valid SVG element",
    )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Root element is not a valid SVG element",
    })
  }

  // DOMPurify's svg+svgFilters profile is the actual security boundary — it strips
  // all on* event handlers and dangerous elements by default. The explicit lists
  // below are defense-in-depth for the highest-risk items; do not treat them as
  // exhaustive. Adding an entry here does not replace the profile's coverage.
  const sanitized = DOMPurify.sanitize(content, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject", "use"],
    FORBID_ATTR: ["onload", "onclick", "onerror", "onmouseover"],
  })

  return sanitized
}

export const putFileDirect = async ({
  key,
  body,
  tags,
}: {
  key: string
  body: string
  tags?: { key: string; value: string }[]
}): Promise<void> => {
  const contentType = getContentTypeFromKey(key)
  const contentDisposition = getContentDispositionForKey(key)
  await putObjectDirect({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentDisposition: contentDisposition,
    Tagging: tags && generateTagsQueryString(tags),
  })
}
