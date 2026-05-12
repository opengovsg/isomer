import { TRPCError } from "@trpc/server"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { markFileAsDeleted } from "~/server/modules/asset/asset.service"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { db } from "../database"
import { isActiveIsomerAdmin } from "../permissions/permissions.service"
import { generateTagsQueryString, getContentDispositionForKey, getContentTypeFromKey } from "../asset/asset.service";
import { env } from "~/env.mjs";
import { copyFile, deleteFile, generateSignedGetUrl, generateSignedPutUrl } from "~/lib/s3";
import { PdfReader } from "pdfreader";
import filenamify from "filenamify";
import {
  EGAZETTE_DOCUMENT_INDEX,
  generateDocumentId,
  ISOMER_UA,
  SEARCHSG_BASE_URL,
} from "../searchsg/searchsg.service"

const logger = createBaseLogger({ path: "gazette.service" })

const { S3_GAZETTE_BUCKET_NAME } = env
const pdfReader = new PdfReader({})
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

// NOTE: Identical to the one in assets.service.ts
// just that we swap the bucket.
// Not adding the prop because we want to keep it separate - 
// we want to isolate gazette stuff as much as possible
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
    Bucket: S3_GAZETTE_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentDisposition: contentDisposition,
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

// Taken as is from egazette codebase.
export const parseFullTextFromPDF = async (pdfBuffer: Uint8Array) => {
  const data: string[] = await new Promise((resolve, reject) => {
    const parsedData: string[] = []
    pdfReader.parseBuffer(Buffer.from(pdfBuffer), (err, item) => {
      if (err) {
        reject(new Error(err))
      } else if (!item) {
        resolve(parsedData)
      } else if (item.text) {
        parsedData.push(item.text)
      }
    })
  })

  return data.join(" ")
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
  const response = await fetch(
    `${SEARCHSG_BASE_URL}/v2/indexes/${EGAZETTE_DOCUMENT_INDEX}/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${env.SEARCHSG_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": ISOMER_UA,
      },
      body: JSON.stringify({ documentsToDelete: [documentId] }),
    },
  )

  if (!response.ok) {
    logger.warn(
      { status: response.status, documentId },
      "Failed to remove gazette from search index",
    )
  }
}

/**
 * Mark a gazette asset as deleted in S3.
 */
export const deleteGazetteAsset = async (ref: string): Promise<void> => {
  try {
    await markFileAsDeleted({
      key: ref.slice(1), // Remove leading slash
    })
  } catch (err) {
    logger.warn({ err, key: ref }, "Failed to mark deleted gazette file in S3")
  }
}
