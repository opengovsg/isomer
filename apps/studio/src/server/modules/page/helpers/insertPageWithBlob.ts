import type {
  ResourceState,
  ResourceType,
} from "~prisma/generated/generatedEnums"
import { TRPCError } from "@trpc/server"
import { get } from "lodash"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"

import type { DB, SafeKysely, Transaction, User } from "../../database"
import { logResourceEvent } from "../../audit/audit.service"
import { jsonb } from "../../database"
import { PG_ERROR_CODES } from "../../database/constants"

const rethrowIfPermalinkConflict = (err: unknown): never => {
  if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A resource with the same permalink already exists",
    })
  }
  throw err
}

export const getUserForAuditLog = async (db: SafeKysely, userId: string) =>
  db
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are authenticated",
        }),
    )

interface NewPageResourceFields {
  title: string
  permalink: string
  siteId: number
  parentId?: string
  type: typeof ResourceType.Page
  state?: ResourceState
  publishedVersionId?: string | null
  scheduledAt?: Date | null
  scheduledBy?: string | null
}

/**
 * Inserts a Blob + Page {@link Resource}, logs {@link AuditLogEvent.ResourceCreate}.
 */
export const insertPageBlobResourceAndAudit = async (
  tx: Transaction<DB>,
  {
    siteId,
    by,
    blobContent,
    resource,
  }: {
    siteId: number
    by: User
    blobContent: PrismaJson.BlobJsonContent
    resource: NewPageResourceFields
  },
) => {
  const blob = await tx
    .insertInto("Blob")
    .values({ content: jsonb(blobContent) })
    .returningAll()
    .executeTakeFirstOrThrow()

  const addedResource = await tx
    .insertInto("Resource")
    .values({
      ...resource,
      draftBlobId: blob.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
    .catch(rethrowIfPermalinkConflict)

  await logResourceEvent(tx, {
    siteId,
    by,
    delta: { before: null, after: { blob, resource: addedResource } },
    eventType: AuditLogEvent.ResourceCreate,
  })

  return addedResource
}
