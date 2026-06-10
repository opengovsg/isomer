import type {
  CreateRedirectInput,
  DeleteRedirectInput,
  ListRedirectsInput,
} from "~/schemas/redirect"
import { TRPCError } from "@trpc/server"

import type { Logger } from "@isomer/logging"

import { logPublishEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"

const getByUser = async (byUserId: string) =>
  db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", byUserId)
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are logged in!",
        }),
    )

export const listRedirects = async ({ siteId }: ListRedirectsInput) => {
  // Soft-deleted redirects are never shown to users. Rows only exist once
  // they are live (creates publish immediately), so createdAt is the time
  // the redirect was published.
  return db
    .selectFrom("Redirect")
    .select(["id", "source", "destination", "createdAt as publishedAt"])
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .orderBy("createdAt", "desc")
    .execute()
}

export const createRedirect = async ({
  siteId,
  source,
  destination,
  byUserId,
  logger,
}: CreateRedirectInput & {
  byUserId: string
  logger: Logger<string>
}) => {
  const byUser = await getByUser(byUserId)

  return db.transaction().execute(async (tx) => {
    // Creating over a live redirect is rejected — users must delete the
    // existing redirect first. A soft-deleted row for the same source is
    // invisible to users, so it doesn't count: it still occupies the
    // (siteId, source) unique constraint and is revived by the upsert below.
    const existing = await tx
      .selectFrom("Redirect")
      .select(["id", "deletedAt"])
      .where("siteId", "=", siteId)
      .where("source", "=", source)
      .executeTakeFirst()
    if (existing && existing.deletedAt === null) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A redirect already exists for ${source}`,
      })
    }

    const created = await tx
      .insertInto("Redirect")
      .values({ siteId, source, destination })
      .onConflict((oc) =>
        oc.columns(["siteId", "source"]).doUpdateSet({
          destination,
          deletedAt: null,
          // A revived redirect is republished now, so its createdAt (shown
          // to users as the publish time) is refreshed
          createdAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow()

    // NOTE: the delta is the real row returned by the insert above, so the
    // audit entry reflects what was committed
    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { created: [created] } },
    })

    // Redirects go live immediately: every mutation triggers a site publish
    await publishSite(logger, { siteId })

    return created
  })
}

export const deleteRedirect = async ({
  siteId,
  id,
  byUserId,
  logger,
}: DeleteRedirectInput & {
  byUserId: string
  logger: Logger<string>
}): Promise<void> => {
  const byUser = await getByUser(byUserId)

  await db.transaction().execute(async (tx) => {
    const deleted = await tx
      .updateTable("Redirect")
      .set({ deletedAt: new Date() })
      .where("siteId", "=", siteId)
      .where("id", "=", id)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst()
    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Redirect not found",
      })
    }

    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { deleted: [deleted] } },
    })

    // Redirects are removed from the live site immediately: every mutation
    // triggers a site publish
    await publishSite(logger, { siteId })
  })
}
