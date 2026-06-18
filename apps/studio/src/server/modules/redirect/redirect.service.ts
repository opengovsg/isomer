import type {
  RedirectValidationIssue,
  RedirectValidationResult,
} from "~/constants/redirect"
import type {
  CountRedirectsByDestinationInput,
  CountRedirectsInput,
  CreateRedirectInput,
  DeleteRedirectInput,
  GetRedirectBySourceInput,
  ListRedirectsInput,
  RedirectSortField,
  ResolveRedirectReferencesInput,
} from "~/schemas/redirect"
import type { DB } from "~prisma/generated/generatedTypes"
import {
  getResourceIdFromReferenceLink,
  REFERENCE_LINK_REGEX,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { REDIRECT_MESSAGES, RedirectValidationCode } from "~/constants/redirect"
import {
  normalizeRedirectPath,
  normalizeRedirectSource,
} from "~/schemas/redirect"
import { getReferenceLink } from "~/utils/link"

import type { Logger } from "@isomer/logging"

import type { SafeKysely, Transaction } from "../database"
import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"
import {
  getDescendantResourceIds,
  getResourceByFullPermalink,
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
// external URLs are stored verbatim. An internal path with no live page yet is
// also kept literal rather than rejected — the preflight surfaces this as a
// non-blocking warning, so an admin can pre-create a redirect to a page they're
// about to publish.
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
      // No live page yet — keep the literal path; the preflight warns about it.
      if (resourceId === null) {
        return parsed.value
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

const getLiveRedirectBySource = (
  dbInstance: SafeKysely,
  { siteId, source }: { siteId: number; source: string },
) =>
  dbInstance
    .selectFrom("Redirect")
    .selectAll()
    .where("siteId", "=", siteId)
    .where("source", "=", source)
    .where("deletedAt", "is", null)
    .executeTakeFirst()

// Resolves a stored destination to a comparable/displayable path: a reference
// to the page's current permalink, a literal path normalised, an external URL
// (or a reference to a missing page) verbatim.
const resolveStoredDestination = async (
  siteId: number,
  storedDestination: string,
): Promise<string> => {
  if (storedDestination.startsWith("/")) {
    return normalizeRedirectPath(storedDestination)
  }
  const resourceId = getResourceIdFromReferenceLink(storedDestination)
  if (resourceId === "") {
    return storedDestination
  }
  const permalinks = await getResourceFullPermalinks(siteId, [
    Number(resourceId),
  ])
  return permalinks.get(Number(resourceId)) ?? storedDestination
}

// Detects whether adding `source -> destination` would chain into, or close a
// loop with, an existing redirect — looking exactly one hop deep. If the
// destination is itself the source of a live redirect, that redirect's resolved
// target is the next hop; the new redirect closes a loop when that target
// resolves back to `source` (the mirror pair `/a -> /b` while `/b -> /a`).
// Longer cycles (`/a -> /b -> /c -> /a`) are intentionally not chased — they're
// rare, and the single-hop check keeps this to one extra read while still
// surfacing the immediate next hop as a non-looping chain warning. Stored
// destinations may be `[resource:...]` references, resolved to the page's
// current permalink before comparing. Only internal paths chain; an external
// https destination never matches a source. `source` is assumed already
// normalised (lowercased), so the destination is normalised the same way before
// it is looked up as a source.
const getChainedRedirect = async (
  dbInstance: SafeKysely,
  {
    siteId,
    source,
    destination,
  }: { siteId: number; source: string; destination: string },
) => {
  if (!destination.startsWith("/")) {
    return null
  }
  const normalizedDestination = normalizeRedirectSource(destination)
  const redirect = await getLiveRedirectBySource(dbInstance, {
    siteId,
    source: normalizedDestination,
  })
  if (!redirect) {
    return null
  }

  const target = await resolveStoredDestination(siteId, redirect.destination)
  // The new redirect closes a loop when the existing redirect's (internal)
  // target normalises back to `source`; an external target can never match.
  const isLoop =
    target.startsWith("/") && normalizeRedirectSource(target) === source

  return { redirect, normalizedDestination, target, isLoop }
}

// Preflight for redirect.create: returns blocking errors and non-blocking
// warnings without mutating. Advisory only — create re-enforces every error.
export const validateRedirect = async ({
  siteId,
  source,
  destination,
}: CreateRedirectInput): Promise<RedirectValidationResult> => {
  const errors: RedirectValidationIssue[] = []
  const warnings: RedirectValidationIssue[] = []

  // Recreating a live redirect for the same source is not allowed — the user
  // must delete the existing one first.
  const existing = await getLiveRedirectBySource(db, { siteId, source })
  if (existing) {
    errors.push({
      code: RedirectValidationCode.AlreadyExists,
      message: REDIRECT_MESSAGES.alreadyExists,
    })
  }

  // A redirect whose source is a published page's live URL would shadow that
  // page, so block it. Only published pages block — an unpublished page isn't
  // live yet, and publishing it later is guarded on the page side.
  const pageAtSource = await getResourceByFullPermalink({
    siteId,
    fullPermalink: source,
  })
  if (pageAtSource && pageAtSource.publishedVersionId !== null) {
    errors.push({
      code: RedirectValidationCode.SourceIsExistingPage,
      message: REDIRECT_MESSAGES.sourceIsExistingPage,
    })
  }

  const chained = await getChainedRedirect(db, { siteId, source, destination })
  if (chained?.isLoop) {
    errors.push({
      code: RedirectValidationCode.RedirectLoop,
      message: REDIRECT_MESSAGES.loop,
      description: `${chained.normalizedDestination} already redirects to ${source}. Visitors will get stuck in between pages. Delete existing redirects or direct to a different page.`,
    })
  } else if (chained) {
    warnings.push({
      code: RedirectValidationCode.DestinationIsRedirectSource,
      message: `This page already redirects to ${chained.target}. Visitors will end up there instead.`,
    })
  } else if (destination.startsWith("/")) {
    // An internal destination with no redirect of its own should point at a
    // real, published page.
    const normalizedDestination = normalizeRedirectPath(destination)
    const resource = await getResourceByFullPermalink({
      siteId,
      fullPermalink: normalizedDestination,
    })
    if (!resource) {
      warnings.push({
        code: RedirectValidationCode.DestinationNotFound,
        message: REDIRECT_MESSAGES.destinationNotLive,
      })
    } else if (resource.publishedVersionId === null) {
      warnings.push({
        code: RedirectValidationCode.DestinationNotPublished,
        message: REDIRECT_MESSAGES.destinationNotLive,
      })
    }
  }

  return { errors, warnings }
}

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

    // Re-enforce the no-loop rule server-side; the preflight is advisory. Unlike
    // the recreate check (constraint-backed), this is a plain read, so two admins
    // racing the mirror pair (/a->/b and /b->/a) could each pass and persist a
    // loop — accepted, since the result is recoverable by deleting either side.
    const chained = await getChainedRedirect(tx, {
      siteId,
      source,
      destination,
    })
    if (chained?.isLoop) {
      // UNPROCESSABLE_CONTENT is reserved for the loop guard — the form maps it
      // to the loop message on the destination field; don't reuse it elsewhere.
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: REDIRECT_MESSAGES.loop,
      })
    }

    // Re-enforce the source-vs-published-page guard (a published page at this
    // URL would be shadowed). Also a plain read, so same accepted race as above.
    // PRECONDITION_FAILED keeps it distinct from the already-exists CONFLICT.
    const pageAtSource = await getResourceByFullPermalink({
      siteId,
      fullPermalink: source,
    })
    if (pageAtSource && pageAtSource.publishedVersionId !== null) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: REDIRECT_MESSAGES.sourceIsExistingPage,
      })
    }

    // Resolve an internal-path destination to a [resource:...] reference (so it
    // follows page renames); a path with no live page yet is kept literal (the
    // preflight already warned). Never blocks the create.
    const storedDestination = await resolveDestinationForStorage(
      siteId,
      destination,
    )

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

// Powers the page-settings warning: is `source` a live redirect's source, and
// where does it point? `source` (a candidate page URL) is normalised like
// stored sources before the lookup; the destination is resolved for display.
export const getRedirectBySource = async ({
  siteId,
  source,
}: GetRedirectBySourceInput): Promise<{ destination: string } | null> => {
  const redirect = await getLiveRedirectBySource(db, {
    siteId,
    source: normalizeRedirectSource(source),
  })
  if (!redirect) {
    return null
  }
  return {
    destination: await resolveStoredDestination(siteId, redirect.destination),
  }
}

// All `[resource:...]` references that point at the resource or any descendant
// — the redirects that break when that subtree is deleted. Reference-only by
// design: a destination stored as a literal path or external URL is not counted
// (only internal-page references follow a resource).
const getDescendantReferences = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<string[]> => {
  const resourceIds = await getDescendantResourceIds(trx, {
    siteId,
    resourceId,
  })
  return resourceIds.map((id) =>
    getReferenceLink({ siteId: String(siteId), resourceId: id }),
  )
}

// Counts the live redirects whose destination points at the resource or any
// descendant, so the delete-page modal can warn before deletion. Shares its
// resolution with the cascade below, so the count matches what gets removed.
export const countRedirectsPointingToResource = async ({
  siteId,
  resourceId,
}: CountRedirectsByDestinationInput): Promise<number> => {
  const references = await getDescendantReferences(db, { siteId, resourceId })
  // An empty `in` list is invalid SQL, so guard like getWithFullPermalink.
  if (references.length === 0) {
    return 0
  }
  const { count } = await db
    .selectFrom("Redirect")
    .select((eb) => eb.fn.countAll().as("count"))
    .where("siteId", "=", siteId)
    .where("destination", "in", references)
    .where("deletedAt", "is", null)
    .executeTakeFirstOrThrow()
  return Number(count)
}

// Soft-deletes every live redirect that points at the resource or any
// descendant, run inside the resource-delete transaction so it commits with the
// delete (the delete's single site publish then covers the removal). Each
// redirect gets its own RedirectDelete audit entry, mirroring deleteRedirect.
export const softDeleteRedirectsPointingToResource = async (
  tx: Transaction<DB>,
  {
    siteId,
    resourceId,
    byUserId,
  }: { siteId: number; resourceId: string; byUserId: string },
) => {
  const references = await getDescendantReferences(tx, { siteId, resourceId })
  // An empty `in` list is invalid SQL, so guard like getWithFullPermalink.
  if (references.length === 0) {
    return []
  }
  const toDelete = await tx
    .selectFrom("Redirect")
    .selectAll()
    .where("siteId", "=", siteId)
    .where("destination", "in", references)
    .where("deletedAt", "is", null)
    .execute()
  if (toDelete.length === 0) {
    return []
  }

  const byUser = await getByUser(byUserId)
  const deleted: typeof toDelete = []
  for (const before of toDelete) {
    const after = await tx
      .updateTable("Redirect")
      .set({ deletedAt: new Date() })
      .where("id", "=", before.id)
      .returningAll()
      .executeTakeFirstOrThrow()
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectDelete,
      delta: { before, after },
    })
    deleted.push(after)
  }
  return deleted
}
