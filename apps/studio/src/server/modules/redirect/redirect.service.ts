import type {
  CountRedirectsInput,
  CreateRedirectInput,
  DeleteRedirectInput,
  ListRedirectsInput,
  RedirectSortField,
} from "~/schemas/redirect"
import { TRPCError } from "@trpc/server"

import type { Logger } from "@isomer/logging"

import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"

// Sort field → column. `publishedAt` maps to `createdAt`; `satisfies` keeps the
// map exhaustive so a new sort field without a column is a compile error.
const SORT_FIELD_TO_COLUMN = {
  source: "source",
  destination: "destination",
  publishedAt: "createdAt",
} as const satisfies Record<
  RedirectSortField,
  "source" | "destination" | "createdAt"
>

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
  // Live rows only; createdAt is the publish time (creates publish immediately).
  let query = db
    .selectFrom("Redirect")
    .select(["id", "source", "destination", "createdAt as publishedAt"])
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .orderBy(SORT_FIELD_TO_COLUMN[sortBy], sortDirection)

  // Tie-break on `source`, then `id` (unique), so equal-valued rows keep a
  // stable order across paginated requests.
  if (sortBy !== "source") {
    query = query.orderBy("source", sortDirection)
  }

  return query
    .orderBy("id", sortDirection)
    .limit(limit)
    .offset(offset)
    .execute()
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

  const created = await db.transaction().execute(async (tx) => {
    // Reject creating over a live redirect. A soft-deleted row for the same
    // source still holds the (siteId, source) unique constraint and is revived
    // by the upsert below.
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
            // Revived rows republish now, so refresh createdAt (the publish
            // time shown to users).
            createdAt: new Date(),
          })
          // Only soft-deleted rows may be revived; a concurrent live create
          // must surface as a conflict, not silently overwrite.
          .where("Redirect.deletedAt", "is not", null),
      )
      .returningAll()
      // A null row means the upsert skipped a live redirect — a conflict.
      .executeTakeFirstOrThrow(
        () =>
          new TRPCError({
            code: "CONFLICT",
            message: `A redirect already exists for ${source}`,
          }),
      )

    // delta holds the real before/after rows committed.
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectCreate,
      delta: { before: existing ?? null, after: created },
    })

    // Every mutation republishes the site; audited as a separate Publish event.
    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { created: [created] } },
    })

    return created
  })

  // Publish after the transaction commits so the external CodeBuild call is off
  // the row locks and a failed publish can't roll back a saved redirect
  // (mirrors publishPageResource's two-step publish).
  await publishSite(logger, { siteId })

  return created
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
      .executeTakeFirstOrThrow(
        () =>
          new TRPCError({
            code: "NOT_FOUND",
            message: "Redirect not found",
          }),
      )

    const deleted = await tx
      .updateTable("Redirect")
      .set({ deletedAt: new Date() })
      .where("id", "=", before.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // delta holds the real before/after rows committed.
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectDelete,
      delta: { before, after: deleted },
    })

    // Every mutation republishes the site; audited as a separate Publish event.
    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { deleted: [deleted] } },
    })
  })

  // Publish after the transaction commits (see createRedirect).
  await publishSite(logger, { siteId })
}
