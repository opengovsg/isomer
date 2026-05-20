import type { Kysely, Transaction } from "kysely"
import { TRPCError } from "@trpc/server"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { type DB } from "~prisma/generated/generatedTypes"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { db, ResourceType, sql } from "../database"
import { isActiveIsomerAdmin } from "../permissions/permissions.service"

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
