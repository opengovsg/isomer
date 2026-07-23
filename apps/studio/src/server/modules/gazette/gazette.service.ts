import type { Kysely, Transaction } from "kysely"
import { TRPCError } from "@trpc/server"
import filenamify from "filenamify"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { env } from "~/env.mjs"
import { GazetteCategories } from "~/features/gazettes/constants"
import { deleteObjectsFromSearchIndexByFilter } from "~/lib/algolia"
import { createBaseLogger } from "~/lib/logger"
import {
  copyFile,
  deleteFile,
  generateSignedGetUrl,
  generateSignedPutUrl,
} from "~/lib/s3"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"
import { type DB } from "~prisma/generated/generatedTypes"

import {
  generateTagsQueryString,
  getContentDispositionForKey,
  getContentTypeFromKey,
} from "../asset/asset.service"
import { db, ResourceType, sql } from "../database"
import { isActiveIsomerAdmin } from "../permissions/permissions.service"
import {
  EGAZETTE_DOCUMENT_INDEX,
  ISOMER_UA,
  SEARCHSG_BASE_URL,
} from "../searchsg/searchsg.service"

export const generateDocumentId = (url: string, resourceId: string): string =>
  `${url}-${resourceId}`

const { S3_GAZETTE_BUCKET_NAME } = env
const logger = createBaseLogger({ path: "gazette.service" })
/**
 * Throws FORBIDDEN unless the user is from Toppan or a Core IsomerAdmin.
 *
 * Without this check, anyone with site read/edit permission could call
 * gazette procedures directly with the gazette collection id.
 */
export const assertGazetteAccess = async (userId: string): Promise<void> => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .select("email")
    .executeTakeFirst()

  if (!user) {
    // protectedProcedure already validated the session above us, so a missing
    // User row here is server-state inconsistency, not an auth failure.
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
  }

  if (user.email.endsWith(TOPPAN_EMAIL_DOMAIN)) return

  const isCoreAdmin = await isActiveIsomerAdmin(userId, [
    IsomerAdminRole.Core,
    IsomerAdminRole.Migrator,
  ])
  if (!isCoreAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to the gazette feature",
    })
  }
}

/**
 * Finds a CollectionLink resource in the given collection whose draft or
 * published blob has a matching filename (last segment of page.ref).
 *
 * Used to detect duplicate file IDs before create/update.
 */
export const findCollectionLinkWithFilename = async ({
  trx = db,
  siteId,
  parentId,
  filename,
  excludeId,
}: {
  trx?: Kysely<DB> | Transaction<DB>
  siteId: number
  parentId: string | null
  filename: string
  excludeId?: string
}) => {
  let query = trx
    .selectFrom("Resource")
    .leftJoin("Blob as DraftBlob", "Resource.draftBlobId", "DraftBlob.id")
    .leftJoin("Version", "Resource.publishedVersionId", "Version.id")
    .leftJoin("Blob as PublishedBlob", "Version.blobId", "PublishedBlob.id")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.parentId", "=", parentId)
    .where("Resource.type", "=", ResourceType.CollectionLink)
    .where(
      sql<boolean>`(
        split_part("DraftBlob"."content"->'page'->>'ref', '/', -1) = ${filename}
        OR split_part("PublishedBlob"."content"->'page'->>'ref', '/', -1) = ${filename}
      )`,
    )
    .select("Resource.id")

  if (excludeId) {
    query = query.where("Resource.id", "!=", excludeId)
  }

  return query.executeTakeFirst()
}

// NOTE: Identical to the one in assets.service.ts
// just that we swap the bucket.
// Not adding the prop because we want to keep it separate -
// we want to isolate gazette stuff as much as possible
export const getPresignedPutUrl = async ({
  key,
  fileSize,
  tags,
}: {
  key: string
  fileSize: number
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
    Bucket: S3_GAZETTE_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentDisposition: contentDisposition,
    ContentLength: fileSize,
    Tagging: tags && stringifiedTags,
  })
  return { presignedPutUrl, contentType, contentDisposition }
}

export const getPresignedGetUrl = async ({
  key,
}: {
  key: string
}): Promise<string> => {
  return generateSignedGetUrl({
    Bucket: S3_GAZETTE_BUCKET_NAME,
    Key: key,
  })
}

/**
 * Copy `sourceKey` to a new key derived by replacing the filename segment with
 * `newFileName`. Does NOT delete the source — the caller is responsible for
 * scheduling the soft-delete *after* whatever DB write references the new key
 * has committed, so a tx rollback never leaves a resource pointing at a
 * tombstoned object.
 */
export const copyFileWithNewName = async ({
  sourceKey,
  newFileName,
}: {
  sourceKey: string
  newFileName: string
}): Promise<string> => {
  const parts = sourceKey.split("/")
  // NOTE: This is in `/year/category/subcategory/filename` format
  if (parts.length < 4) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid source key format",
    })
  }
  const prefix = parts.slice(0, 3).join("/")

  // Build new key with sanitized new filename
  const sanitizedFileName = filenamify(newFileName, { replacement: "-" })
  const newKey = `${prefix}/${sanitizedFileName}`

  // Copy to new location. The aws-sdk v3 CopyObjectCommand defaults
  // `TaggingDirective` to `COPY`, so the ISOMER_STATUS tag (and any other
  // object tags) carry over without us having to set them explicitly.
  await copyFile({
    SourceKey: sourceKey,
    DestKey: newKey,
    Bucket: S3_GAZETTE_BUCKET_NAME,
  })

  return newKey
}

export const markFileAsDeleted = async ({ key }: { key: string }) => {
  await deleteFile({
    Key: key,
    Bucket: S3_GAZETTE_BUCKET_NAME,
  })
}

/**
 * Remove a gazette document from the SearchSG index.
 */
export const removeGazetteFromSearchIndex = async (
  ref: string,
  resourceId: string,
): Promise<void> => {
  const documentId = generateDocumentId(ref, resourceId)
  const { accessToken, tokenType } = await getSearchSGAuthToken()
  const response = await fetch(
    `${SEARCHSG_BASE_URL}/v2/indexes/${EGAZETTE_DOCUMENT_INDEX}/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": ISOMER_UA,
      },
      body: JSON.stringify({ documentsToDelete: [documentId] }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.warn(
      { status: response.status, documentId, error: errorText },
      "Failed to remove gazette from search index",
    )
    throw new TRPCError({
      message: "Failed to remove gazette from search index",
      code: "PRECONDITION_FAILED",
    })
  }
}

/**
 * Mark a gazette asset as deleted in S3. Throws on failure — silent failure
 * here would leave the PDF publicly reachable after the gazette is "deleted"
 * from SearchSG and the DB, defeating the purpose of the grace-period delete.
 *
 * On failure we also log the public URL so ops has a recovery target — by
 * this point SearchSG removal has already succeeded, so the gazette is
 * deindexed but still reachable at this URL until the soft-delete completes.
 */
export const deleteGazetteAsset = async (ref: string): Promise<void> => {
  const key = ref.slice(1) // Remove leading slash
  try {
    await markFileAsDeleted({ key })
  } catch (err) {
    const publicUrl = `https://${env.S3_GAZETTE_DOMAIN_NAME}${ref}`
    logger.error(
      { err, key, publicUrl },
      "Failed to soft-delete gazette in S3; the file may still be publicly reachable at publicUrl until manually cleaned up",
    )
    throw err
  }
}

const getSearchSGAuthToken = async () => {
  const response = await fetch(`${SEARCHSG_BASE_URL}/v1/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.SEARCHSG_API_KEY}`,
      "User-Agent": ISOMER_UA,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get SearchSG auth token: ${response.statusText}`)
  }

  const { accessToken, tokenType } = (await response.json()) as {
    accessToken: string
    tokenType: string
  }

  return { accessToken, tokenType }
}

export interface PushDocument {
  documentId: string
  title: string
  url: string
  contentType: string
  content: string
  date: string
  categories: string[]
}

/**
 * Remove all Algolia records for a gazette identified by its S3 ref.
 *
 * Deletes by objectGroup filter rather than individual objectIDs because the
 * number of chunks is not known at delete time (Algolia's deleteBy handles the
 * fan-out). resourceId is not needed for Algolia — objectGroup is the unique
 * dedup key for all of a gazette's records.
 *
 * The objectGroup value is wrapped in double quotes in the filter expression
 * because it contains forward slashes and a dot (e.g. "2026/cat/sub/file.pdf")
 * which Algolia's filter parser would otherwise mis-tokenise.
 */
export const removeGazetteFromAlgolia = async (ref: string): Promise<void> => {
  const objectGroup = ref.slice(1)
  try {
    await deleteObjectsFromSearchIndexByFilter(`objectGroup:"${objectGroup}"`)
  } catch (error) {
    logger.warn({ error, objectGroup }, "Failed to remove gazette from Algolia")
    throw new TRPCError({
      message: "Failed to remove gazette from search index",
      code: "PRECONDITION_FAILED",
    })
  }
}

export const pushDocumentsForIngestion = async (documents: PushDocument[]) => {
  if (documents.length === 0) {
    return
  }

  const { accessToken, tokenType } = await getSearchSGAuthToken()

  const response = await fetch(
    `${SEARCHSG_BASE_URL}/v2/indexes/${EGAZETTE_DOCUMENT_INDEX}/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": ISOMER_UA,
      },
      body: JSON.stringify({ documentsToAdd: documents }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(
      { status: response.status, error: errorText, documents },
      "Failed to push documents for ingestion",
    )
    throw new Error(
      `Failed to push documents for ingestion: ${response.statusText} ${errorText}`,
    )
  }

  logger.info(
    { count: documents.length },
    "Successfully pushed documents for ingestion",
  )
}

/**
 * Detects whether another gazette in the same collection already uses the
 * given notification number. A gazette is a duplicate when it shares the
 * same notification number, category and publish year. For non-Government
 * Gazette categories the subcategory must match too — Government Gazette
 * numbers are unique within the category, not the subcategory.
 *
 * Gazette metadata lives in the resource's draft (or published) blob:
 * `content.page.{description,category,date,tagged}`. `date` is stored as a
 * "dd/MM/yyyy" string, so the year is its third "/"-delimited segment.
 * Deleted gazettes are hard-deleted, so no soft-delete filter is needed.
 */
export const hasDuplicateNotificationNumber = async ({
  trx = db,
  siteId,
  parentId,
  notificationNumber,
  publishDate,
  category,
  subCategory,
  excludeId,
}: {
  trx?: Kysely<DB> | Transaction<DB>
  siteId: number
  parentId: string | null
  notificationNumber: string
  publishDate: string
  category: string
  subCategory: string
  excludeId?: string
}): Promise<boolean> => {
  const isGovernmentGazette = category === GazetteCategories.GovernmentGazettes
  // publishDate is a "dd/MM/yyyy" string — the year is the last segment.
  const publishYear = publishDate.split("/").at(-1)

  const content = sql`COALESCE("DraftBlob"."content", "PublishedBlob"."content")`

  let query = trx
    .selectFrom("Resource")
    .leftJoin("Blob as DraftBlob", "Resource.draftBlobId", "DraftBlob.id")
    .leftJoin("Version", "Resource.publishedVersionId", "Version.id")
    .leftJoin("Blob as PublishedBlob", "Version.blobId", "PublishedBlob.id")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.parentId", "=", parentId)
    .where("Resource.type", "=", ResourceType.CollectionLink)
    .where(
      sql<boolean>`${content}->'page'->>'description' = ${notificationNumber}`,
    )
    .where(sql<boolean>`${content}->'page'->>'category' = ${category}`)
    .where(
      sql<boolean>`split_part(${content}->'page'->>'date', '/', 3) = ${publishYear}`,
    )
    .select("Resource.id")

  // Government gazettes are unique within category, not subcategory.
  if (!isGovernmentGazette) {
    query = query.where(
      sql<boolean>`${content}->'page'->'tagged'->>0 = ${subCategory}`,
    )
  }

  if (excludeId) {
    query = query.where("Resource.id", "!=", excludeId)
  }

  const duplicate = await query.executeTakeFirst()
  return duplicate !== undefined
}
