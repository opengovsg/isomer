import type {
  CountRedirectsInput,
  CreateRedirectInput,
  DeleteRedirectInput,
  ListRedirectsInput,
} from "~/schemas/redirect"
import { TRPCError } from "@trpc/server"

import type { Logger } from "@isomer/logging"

import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
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

export const listRedirects = async ({
  siteId,
  sortBy,
  sortDirection,
  limit,
  offset,
}: ListRedirectsInput) => {
  // Soft-deleted redirects are never shown to users. Rows only exist once
  // they are live (creates publish immediately), so createdAt is the time
  // the redirect was published.
  return (
    db
      .selectFrom("Redirect")
      .select(["id", "source", "destination", "createdAt as publishedAt"])
      .where("siteId", "=", siteId)
      .where("deletedAt", "is", null)
      .orderBy(sortBy === "publishedAt" ? "createdAt" : sortBy, sortDirection)
      // Tie-break on id so rows with equal sort values don't shuffle between
      // pages across requests
      .orderBy("id", sortDirection)
      .limit(limit)
      .offset(offset)
      .execute()
  )
}

export const countRedirects = async ({ siteId }: CountRedirectsInput) => {
  const { count } = await db
    .selectFrom("Redirect")
    .select((eb) => eb.fn.countAll().as("count"))
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .executeTakeFirstOrThrow()
  return Number(count)
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
      .selectAll()
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
        oc
          .columns(["siteId", "source"])
          .doUpdateSet({
            destination,
            deletedAt: null,
            // A revived redirect is republished now, so its createdAt (shown
            // to users as the publish time) is refreshed
            createdAt: new Date(),
          })
          // Only soft-deleted rows may be revived: a concurrent create for
          // the same source can commit after the pre-check above, and must
          // surface as a conflict instead of silently overwriting the live
          // redirect
          .where("Redirect.deletedAt", "is not", null),
      )
      .returningAll()
      .executeTakeFirst()
    if (!created) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A redirect already exists for ${source}`,
      })
    }

    // NOTE: the delta holds real DB rows — `existing` as fetched before the
    // write (the soft-deleted row when reviving) and the row returned by the
    // insert — so the audit entry reflects exactly what was committed
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectCreate,
      delta: { before: existing ?? null, after: created },
    })

    // Redirects go live immediately: every mutation triggers a site publish,
    // which is audited separately like other site publishes
    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { created: [created] } },
    })
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
    const before = await tx
      .selectFrom("Redirect")
      .selectAll()
      .where("siteId", "=", siteId)
      .where("id", "=", id)
      .where("deletedAt", "is", null)
      .executeTakeFirst()
    if (!before) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Redirect not found",
      })
    }

    const deleted = await tx
      .updateTable("Redirect")
      .set({ deletedAt: new Date() })
      .where("id", "=", before.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // NOTE: the delta holds real DB rows — the live row fetched before the
    // write and the soft-deleted row returned by the update
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectDelete,
      delta: { before, after: deleted },
    })

    // Redirects are removed from the live site immediately: every mutation
    // triggers a site publish, which is audited separately like other site
    // publishes
    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { deleted: [deleted] } },
    })
    await publishSite(logger, { siteId })
  })
}
