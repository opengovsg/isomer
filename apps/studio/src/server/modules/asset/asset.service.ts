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

import type { Logger } from "@isomer/logging"

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

// Matches an uploaded asset reference for the given site as it is stored inside
// a page blob, e.g. "/1/<uuid>/report.pdf". Uploaded assets always live under a
// random UUID folder (see getFileKey), so keying off that shape avoids matching
// internal page links (e.g. "/about-us") or legacy GitHub-hosted assets that are
// not in our S3 bucket. Kept in sync with the `files` pattern in
// `@opengovsg/isomer-components` (convertAssetLinks).
const buildSiteAssetPathRegex = (siteId: number): RegExp =>
  new RegExp(
    `^/${siteId}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/`,
  )

/**
 * Recursively walks a page blob's content and returns the S3 object keys of
 * every uploaded asset it references for the given site. Keys are returned
 * without the leading slash (i.e. the exact S3 object key), de-duplicated.
 */
export const getFileKeysFromBlobContent = ({
  content,
  siteId,
}: {
  content: unknown
  siteId: number
}): string[] => {
  const assetPathRegex = buildSiteAssetPathRegex(siteId)
  const fileKeys = new Set<string>()

  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      // Asset references are stored with a leading slash; the S3 object key is
      // the same value without it.
      if (assetPathRegex.test(value)) {
        fileKeys.add(value.slice(1))
      }
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item)
      }
      return
    }

    if (value !== null && typeof value === "object") {
      for (const item of Object.values(value)) {
        walk(item)
      }
    }
  }

  walk(content)
  return Array.from(fileKeys)
}

/**
 * Returns the S3 object keys of assets that were referenced in `before` but are
 * no longer referenced in `after` — i.e. the files a page edit orphaned (for
 * example by deleting a block). Keys still present in `after` are preserved.
 */
export const getRemovedFileKeys = ({
  before,
  after,
  siteId,
}: {
  before: unknown
  after: unknown
  siteId: number
}): string[] => {
  const remainingKeys = new Set(
    getFileKeysFromBlobContent({ content: after, siteId }),
  )
  return getFileKeysFromBlobContent({ content: before, siteId }).filter(
    (key) => !remainingKeys.has(key),
  )
}

/**
 * Best-effort soft-delete of many file keys belonging to a site. Keys that do
 * not belong to the site are skipped as a defensive guard. Never throws:
 * callers treat file cleanup as best-effort so a storage failure cannot undo an
 * already-committed database change; failures are logged instead.
 */
export const softDeleteSiteFiles = async ({
  fileKeys,
  siteId,
  logger: requestLogger = logger,
}: {
  fileKeys: string[]
  siteId: number
  logger?: Logger<string>
}): Promise<void> => {
  const siteFileKeys = fileKeys.filter((key) =>
    doAllFileKeysBelongToSite({ fileKeys: [key], siteId }),
  )

  if (siteFileKeys.length === 0) {
    return
  }

  const results = await Promise.allSettled(
    siteFileKeys.map((key) => markFileAsDeleted({ key })),
  )

  const failedCount = results.filter(
    (result) => result.status === "rejected",
  ).length

  if (failedCount > 0) {
    requestLogger.error(
      {
        siteId,
        failedCount,
        totalCount: siteFileKeys.length,
      },
      "Failed to soft-delete some associated files from S3",
    )
  }
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
