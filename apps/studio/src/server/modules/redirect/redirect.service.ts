import type {
  CountRedirectsInput,
  CreateRedirectInput,
  DeleteRedirectInput,
  ListRedirectsInput,
  RedirectSortField,
  ResolveRedirectReferencesInput,
} from "~/schemas/redirect"
import { REFERENCE_LINK_REGEX } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { getReferenceLink } from "~/utils/link"

import type { Logger } from "@isomer/logging"

import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"
import {
  getResourceFullPermalinks,
  getResourceIdByPermalink,
} from "../resource/resource.service"

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

// Anchored form of the shared [resource:siteId:resourceId] reference, capturing
// siteId/resourceId (the shared regex is unanchored). A value only counts as a
// reference when it is exactly one.
const REFERENCE_DESTINATION_REGEX = new RegExp(
  `^${REFERENCE_LINK_REGEX.source}$`,
)

// A destination is exactly one of three shapes. The `type` discriminant keeps
// the branches in resolveDestinationForStorage explicit instead of a chain of
// string checks.
type ParsedDestination =
  | { type: "reference"; value: string }
  | { type: "external"; value: string }
  | { type: "internalPath"; value: string }

const parseDestination = (destination: string): ParsedDestination => {
  if (REFERENCE_DESTINATION_REGEX.test(destination)) {
    return { type: "reference", value: destination }
  }
  if (destination.startsWith("/")) {
    return { type: "internalPath", value: destination }
  }
  return { type: "external", value: destination }
}

// Resolves a destination to its stored form. A bare internal path becomes a
// [resource:...] reference (so it follows page renames); a query-suffixed path
// stays literal (a query can't map to a single resource); references and
// external URLs are stored verbatim.
const resolveDestinationForStorage = async (
  siteId: number,
  destination: string,
): Promise<string> => {
  const parsed = parseDestination(destination)
  switch (parsed.type) {
    case "reference":
    case "external":
      return parsed.value
    case "internalPath": {
      if (parsed.value.includes("?")) {
        return parsed.value
      }
      const resourceId = await getResourceIdByPermalink(siteId, parsed.value)
      if (resourceId === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `The page "${destination}" does not exist`,
        })
      }
      return getReferenceLink({
        siteId: String(siteId),
        resourceId: String(resourceId),
      })
    }
  }
}

// Resolves stored [resource:...] destinations back to current permalinks for
// display, batched into one query. A reference to a missing page resolves to null.
export const resolveRedirectReferences = async ({
  siteId,
  references,
}: ResolveRedirectReferencesInput): Promise<
  { reference: string; permalink: string | null }[]
> => {
  // Resolve only references that are anchored AND belong to this site — a
  // reference to another site can't resolve here, so it stays unresolved.
  const parsed = references.map((reference) => {
    const match = REFERENCE_DESTINATION_REGEX.exec(reference)
    return {
      reference,
      resourceId:
        match && Number(match[1]) === siteId ? Number(match[2]) : null,
    }
  })
  const resourceIds = parsed
    .map(({ resourceId }) => resourceId)
    .filter((id): id is number => id !== null)
  const permalinks = await getResourceFullPermalinks(siteId, resourceIds)
  return parsed.map(({ reference, resourceId }) => ({
    reference,
    permalink:
      resourceId === null ? null : (permalinks.get(resourceId) ?? null),
  }))
}

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

  // Resolve an internal-path destination to a [resource:...] reference (a read,
  // outside the tx) so the redirect follows the page if its permalink changes.
  // Throws NOT_FOUND if the path matches no page.
  const storedDestination = await resolveDestinationForStorage(
    siteId,
    destination,
  )

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
      .values({ siteId, source, destination: storedDestination })
      .onConflict((oc) =>
        oc
          .columns(["siteId", "source"])
          .doUpdateSet({
            destination: storedDestination,
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
