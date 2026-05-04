import { TRPCError } from "@trpc/server"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { db } from "../database"
import { isActiveIsomerAdmin } from "../permissions/permissions.service"
import { generateTagsQueryString, getContentDispositionForKey, getContentTypeFromKey } from "../asset/asset.service";
import { env } from "~/env.mjs";
import { generateSignedGetUrl, generateSignedPutUrl } from "~/lib/s3";

const { S3_GAZETTE_BUCKET_NAME } = env
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
