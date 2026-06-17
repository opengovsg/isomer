import type {
  CountRedirectsInput,
  CreateRedirectInput,
  DeleteRedirectInput,
  ListRedirectsInput,
  RedirectSortField,
  RedirectValidationIssue,
  RedirectValidationResult,
  ResolveRedirectReferencesInput,
} from "~/schemas/redirect"
import {
  getResourceIdFromReferenceLink,
  REFERENCE_LINK_REGEX,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import {
  normalizeRedirectPath,
  REDIRECT_MESSAGES,
  RedirectValidationCode,
} from "~/schemas/redirect"
import { getReferenceLink } from "~/utils/link"

import type { Logger } from "@isomer/logging"

import type { SafeKysely } from "../database"
import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"
import {
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

// Resolves a redirect's stored destination to a comparable / displayable path.
// Internal destinations are persisted as `[resource:...]` references, so a
// stored reference is resolved to the page's current permalink; a literal path
// is normalised; an external https URL (or a reference whose page no longer
// exists) is returned verbatim.
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

// Looks up a live redirect whose source equals the given destination path —
// i.e. the destination is itself a redirect source. Returns the redirect, its
// resolved `target` (the page it ultimately points at), and whether that target
// is `source` (a 1-level loop). The stored destination may be a `[resource:...]`
// reference, so it is resolved to the page's current permalink before comparing
// or displaying. Only internal paths can chain; an external https destination
// never matches a stored source. `source` is assumed already normalised.
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
  const normalizedDestination = normalizeRedirectPath(destination)
  const redirect = await getLiveRedirectBySource(dbInstance, {
    siteId,
    source: normalizedDestination,
  })
  if (!redirect) {
    return null
  }
  const target = await resolveStoredDestination(siteId, redirect.destination)
  return { redirect, normalizedDestination, target, isLoop: target === source }
}

// Preflight for redirect.create: returns the blocking errors and non-blocking
// warnings for a would-be redirect without mutating anything. The create
// endpoint independently re-enforces every error, so this can never be the
// only thing standing between an invalid redirect and the database.
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

  // A redirect whose source is the live URL of a published page would shadow
  // that page on the published site (the redirect takes precedence), leaving it
  // unreachable. Block it. Only PUBLISHED pages block — an unpublished page at
  // this path isn't live yet, and publishing it later is guarded on the page
  // side (see ISOM-2266). `source` is already normalised by the schema.
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

    // Re-enforce the no-loop rule server-side (the client preflights via
    // redirect.validate, but create must never trust that). A warning-level
    // chain does not block — only a redirect that points straight back.
    //
    // NOTE: unlike the recreate check above (backed by the (siteId, source)
    // unique constraint), this loop guard is a plain read under READ
    // COMMITTED. Two admins concurrently creating the mirror pair — /a -> /b
    // and /b -> /a — can each pass this check before the other commits and
    // persist a 1-level loop. The window requires two racing admins on the
    // same site and the impact is a recoverable loop (delete either side), so
    // we accept it rather than serialize every create with an advisory lock.
    // Flagged so the asymmetry with the constraint-backed recreate path reads
    // as intentional, not an oversight.
    const chained = await getChainedRedirect(tx, {
      siteId,
      source,
      destination,
    })
    if (chained?.isLoop) {
      // The add-redirect form maps this UNPROCESSABLE_CONTENT code to the loop
      // message inline on the destination field, so keep this code reserved for
      // the loop guard — don't reuse it for other create-time failures.
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: REDIRECT_MESSAGES.loop,
      })
    }

    // Re-enforce the source-vs-published-page guard server-side: a redirect
    // whose source is a published page's live URL would shadow that page. Like
    // the loop guard, this is a plain read (not constraint-backed), so a page
    // published in the same window could still slip through; the impact is a
    // recoverable shadow (delete the redirect), so we accept it. PRECONDITION_
    // FAILED keeps this distinct from the CONFLICT used for an already-existing
    // redirect, so the form can show the right message on the source field.
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

    // Resolve an internal-path destination to a [resource:...] reference so the
    // redirect follows the page if its permalink later changes. Done after the
    // guards above so a bad source / loop surfaces its own specific error rather
    // than the destination NOT_FOUND. Throws NOT_FOUND if the path has no page.
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
